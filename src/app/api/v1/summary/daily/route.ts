import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/../auth";
import { prisma } from "@/lib/prisma";
import {
  dailySummaryQuerySchema,
  calculateMealTotal,
  calculateAchievementRate,
  emptyNutrition,
  mealTypes,
  MealType,
  Nutrition,
} from "@/lib/meals";
import { getDateRange } from "@/lib/utils";

/**
 * GET /api/v1/summary/daily
 * 日次サマリー取得
 */
export async function GET(request: NextRequest) {
  try {
    // 認証チェック
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "UNAUTHORIZED", message: "認証が必要です" },
        },
        { status: 401 }
      );
    }

    const userId = parseInt(session.user.id, 10);

    // クエリパラメータ取得
    const { searchParams } = new URL(request.url);
    const queryParams = {
      date: searchParams.get("date") || undefined,
    };

    // バリデーション
    const queryResult = dailySummaryQuerySchema.safeParse(queryParams);
    if (!queryResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message:
              queryResult.error.issues[0]?.message ||
              "日付パラメータが必要です",
          },
        },
        { status: 422 }
      );
    }

    const { date } = queryResult.data;

    // ユーザーの目標値を取得
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        dailyCalorieTarget: true,
        dailyProteinTarget: true,
        dailyFatTarget: true,
        dailyCarbTarget: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "NOT_FOUND", message: "ユーザーが見つかりません" },
        },
        { status: 404 }
      );
    }

    const targets: Nutrition = {
      calories: user.dailyCalorieTarget || 2000,
      protein: user.dailyProteinTarget || 60,
      fat: user.dailyFatTarget || 55,
      carbohydrate: user.dailyCarbTarget || 300,
    };

    // 該当日の食事記録を取得（@db.Dateフィールドとの比較のため範囲検索を使用）
    const range = getDateRange(date);
    const meals = await prisma.mealRecord.findMany({
      where: {
        userId,
        recordDate: {
          gte: range.start,
          lt: range.end,
        },
      },
      include: {
        mealItems: true,
      },
    });

    // 食事タイプ別の集計を計算
    const byMealType: Record<MealType, Nutrition> = {
      breakfast: emptyNutrition(),
      lunch: emptyNutrition(),
      dinner: emptyNutrition(),
      snack: emptyNutrition(),
    };

    for (const meal of meals) {
      const mealTotal = calculateMealTotal(meal.mealItems);
      byMealType[meal.mealType] = {
        calories: byMealType[meal.mealType].calories + mealTotal.calories,
        protein: byMealType[meal.mealType].protein + mealTotal.protein,
        fat: byMealType[meal.mealType].fat + mealTotal.fat,
        carbohydrate:
          byMealType[meal.mealType].carbohydrate + mealTotal.carbohydrate,
      };
    }

    // 1日の合計を計算
    const totals: Nutrition = {
      calories: 0,
      protein: 0,
      fat: 0,
      carbohydrate: 0,
    };

    for (const type of mealTypes) {
      totals.calories += byMealType[type].calories;
      totals.protein += byMealType[type].protein;
      totals.fat += byMealType[type].fat;
      totals.carbohydrate += byMealType[type].carbohydrate;
    }

    // 小数点2桁に丸め
    totals.calories = Math.round(totals.calories * 100) / 100;
    totals.protein = Math.round(totals.protein * 100) / 100;
    totals.fat = Math.round(totals.fat * 100) / 100;
    totals.carbohydrate = Math.round(totals.carbohydrate * 100) / 100;

    // 達成率を計算
    const achievement = {
      calories: calculateAchievementRate(totals.calories, targets.calories),
      protein: calculateAchievementRate(totals.protein, targets.protein),
      fat: calculateAchievementRate(totals.fat, targets.fat),
      carbohydrate: calculateAchievementRate(
        totals.carbohydrate,
        targets.carbohydrate
      ),
    };

    return NextResponse.json({
      success: true,
      data: {
        date,
        totals,
        targets,
        achievement,
        by_meal_type: byMealType,
      },
    });
  } catch (error) {
    console.error("GET /api/v1/summary/daily error:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "サーバーエラーが発生しました",
        },
      },
      { status: 500 }
    );
  }
}
