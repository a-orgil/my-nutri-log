import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/../auth";
import { prisma } from "@/lib/prisma";
import {
  mealFormSchema,
  mealSearchQuerySchema,
  formatMealForResponse,
  calculateNutrition,
  MealType,
} from "@/lib/meals";

/**
 * GET /api/v1/meals
 * 食事記録一覧取得
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
      startDate: searchParams.get("start_date") || undefined,
      endDate: searchParams.get("end_date") || undefined,
      mealType: searchParams.get("meal_type") || undefined,
    };

    // バリデーション
    const queryResult = mealSearchQuerySchema.safeParse(queryParams);
    if (!queryResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message:
              queryResult.error.issues[0]?.message || "パラメータが不正です",
          },
        },
        { status: 422 }
      );
    }

    const { date, startDate, endDate, mealType } = queryResult.data;

    // 検索条件構築
    const whereCondition: {
      userId: number;
      recordDate?: Date | { gte?: Date; lte?: Date };
      mealType?: MealType;
    } = { userId };

    // 日付条件
    if (date) {
      whereCondition.recordDate = new Date(date);
    } else if (startDate || endDate) {
      whereCondition.recordDate = {};
      if (startDate) {
        whereCondition.recordDate.gte = new Date(startDate);
      }
      if (endDate) {
        whereCondition.recordDate.lte = new Date(endDate);
      }
    }

    // 食事タイプ条件
    if (mealType) {
      whereCondition.mealType = mealType;
    }

    // データ取得
    const meals = await prisma.mealRecord.findMany({
      where: whereCondition,
      include: {
        mealItems: {
          include: {
            foodMaster: {
              select: {
                id: true,
                name: true,
                servingUnit: true,
              },
            },
          },
        },
      },
      orderBy: [{ recordDate: "desc" }, { mealType: "asc" }],
    });

    // レスポンス形式に変換
    const formattedMeals = meals.map((meal) => formatMealForResponse(meal));

    return NextResponse.json({
      success: true,
      data: { meals: formattedMeals },
    });
  } catch (error) {
    console.error("GET /api/v1/meals error:", error);
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
 * POST /api/v1/meals
 * 食事記録登録
 */
export async function POST(request: NextRequest) {
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

    // リクエストボディ取得
    const body = await request.json();

    // snake_case → camelCase 変換
    const transformedBody = {
      recordDate: body.record_date,
      mealType: body.meal_type,
      memo: body.memo,
      items: body.items?.map(
        (item: { food_id?: number; foodId?: number; quantity: number }) => ({
          foodId: item.food_id ?? item.foodId,
          quantity: item.quantity,
        })
      ),
    };

    // バリデーション
    const validationResult = mealFormSchema.safeParse(transformedBody);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message:
              validationResult.error.issues[0]?.message || "入力内容が不正です",
          },
        },
        { status: 422 }
      );
    }

    const { recordDate, mealType, memo, items } = validationResult.data;

    // 食品マスタの存在確認と取得
    const foodIds = items.map((item) => item.foodId);
    const foods = await prisma.foodMaster.findMany({
      where: {
        id: { in: foodIds },
        OR: [{ userId }, { userId: null }],
      },
    });

    if (foods.length !== foodIds.length) {
      const foundIds = foods.map((f) => f.id);
      const missingIds = foodIds.filter((id) => !foundIds.includes(id));
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: `指定された食品が見つかりません: ID ${missingIds.join(", ")}`,
          },
        },
        { status: 422 }
      );
    }

    // 栄養計算して明細データを準備
    const mealItemsData = items.map((item) => {
      const food = foods.find((f) => f.id === item.foodId)!;
      const nutrition = calculateNutrition(food, item.quantity);
      return {
        foodMasterId: item.foodId,
        quantity: item.quantity,
        calories: nutrition.calories,
        protein: nutrition.protein,
        fat: nutrition.fat,
        carbohydrate: nutrition.carbohydrate,
      };
    });

    // 食事記録作成（トランザクション）
    const meal = await prisma.mealRecord.create({
      data: {
        userId,
        recordDate: new Date(recordDate),
        mealType: mealType as MealType,
        memo: memo || null,
        mealItems: {
          create: mealItemsData,
        },
      },
      include: {
        mealItems: {
          include: {
            foodMaster: {
              select: {
                id: true,
                name: true,
                servingUnit: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: formatMealForResponse(meal),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/v1/meals error:", error);
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
