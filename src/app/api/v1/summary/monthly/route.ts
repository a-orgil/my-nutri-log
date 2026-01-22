import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/../auth";
import { prisma } from "@/lib/prisma";
import {
  monthlySummaryQuerySchema,
  calculateMealTotal,
  Nutrition,
} from "@/lib/meals";
import { getMonthRangeUTC } from "@/lib/utils";

/**
 * GET /api/v1/summary/monthly
 * 月次サマリー取得
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
      year: searchParams.get("year") || undefined,
      month: searchParams.get("month") || undefined,
    };

    // バリデーション
    const queryResult = monthlySummaryQuerySchema.safeParse(queryParams);
    if (!queryResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message:
              queryResult.error.issues[0]?.message ||
              "year, monthパラメータが必要です",
          },
        },
        { status: 422 }
      );
    }

    const { year, month } = queryResult.data;

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

    // 月の開始日と終了日を計算（UTCで統一）
    const { start: startDate, end: endDate } = getMonthRangeUTC(year, month);
    const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();

    // 該当月の食事記録を取得（@db.Dateフィールドとの比較のため範囲検索を使用）
    const meals = await prisma.mealRecord.findMany({
      where: {
        userId,
        recordDate: {
          gte: startDate,
          lt: endDate,
        },
      },
      include: {
        mealItems: true,
      },
    });

    // 日別の集計を作成
    const dailyData: Map<
      string,
      { calories: number; protein: number; fat: number; carbohydrate: number }
    > = new Map();

    for (const meal of meals) {
      const dateStr = formatDateToYYYYMMDD(meal.recordDate);
      const mealTotal = calculateMealTotal(meal.mealItems);

      const current = dailyData.get(dateStr) || {
        calories: 0,
        protein: 0,
        fat: 0,
        carbohydrate: 0,
      };

      dailyData.set(dateStr, {
        calories: current.calories + mealTotal.calories,
        protein: current.protein + mealTotal.protein,
        fat: current.fat + mealTotal.fat,
        carbohydrate: current.carbohydrate + mealTotal.carbohydrate,
      });
    }

    // 全日分のサマリーを作成
    const dailySummaries: Array<{
      date: string;
      calories: number;
      protein: number;
      fat: number;
      carbohydrate: number;
      has_records: boolean;
    }> = [];

    let totalCalories = 0;
    let totalProtein = 0;
    let totalFat = 0;
    let totalCarb = 0;
    let daysWithRecords = 0;

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      const data = dailyData.get(dateStr);
      const hasRecords = !!data;

      if (hasRecords && data) {
        totalCalories += data.calories;
        totalProtein += data.protein;
        totalFat += data.fat;
        totalCarb += data.carbohydrate;
        daysWithRecords++;
      }

      dailySummaries.push({
        date: dateStr,
        calories: roundToTwo(data?.calories || 0),
        protein: roundToTwo(data?.protein || 0),
        fat: roundToTwo(data?.fat || 0),
        carbohydrate: roundToTwo(data?.carbohydrate || 0),
        has_records: hasRecords,
      });
    }

    // 月平均を計算（記録がある日のみ）
    const monthlyAverage: Nutrition = {
      calories:
        daysWithRecords > 0 ? roundToTwo(totalCalories / daysWithRecords) : 0,
      protein:
        daysWithRecords > 0 ? roundToTwo(totalProtein / daysWithRecords) : 0,
      fat: daysWithRecords > 0 ? roundToTwo(totalFat / daysWithRecords) : 0,
      carbohydrate:
        daysWithRecords > 0 ? roundToTwo(totalCarb / daysWithRecords) : 0,
    };

    return NextResponse.json({
      success: true,
      data: {
        year,
        month,
        targets,
        daily_summaries: dailySummaries,
        monthly_average: monthlyAverage,
      },
    });
  } catch (error) {
    console.error("GET /api/v1/summary/monthly error:", error);
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

/**
 * 日付をYYYY-MM-DD形式に変換（UTC基準）
 */
function formatDateToYYYYMMDD(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * 小数点2桁に丸める
 */
function roundToTwo(value: number): number {
  return Math.round(value * 100) / 100;
}
