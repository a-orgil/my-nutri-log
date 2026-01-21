import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/../auth";
import { prisma } from "@/lib/prisma";
import {
  mealUpdateSchema,
  formatMealForResponse,
  calculateNutrition,
  MealType,
} from "@/lib/meals";

/**
 * GET /api/v1/meals/:id
 * 食事記録詳細取得
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

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
    const mealId = parseInt(id, 10);

    if (isNaN(mealId)) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "VALIDATION_ERROR", message: "IDが不正です" },
        },
        { status: 422 }
      );
    }

    // 食事記録取得
    const meal = await prisma.mealRecord.findUnique({
      where: { id: mealId },
      include: {
        mealItems: {
          include: {
            foodMaster: {
              select: {
                id: true,
                name: true,
                servingUnit: true,
                calories: true,
                protein: true,
                fat: true,
                carbohydrate: true,
                servingSize: true,
              },
            },
          },
        },
      },
    });

    if (!meal) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "NOT_FOUND", message: "食事記録が見つかりません" },
        },
        { status: 404 }
      );
    }

    // 所有者チェック
    if (meal.userId !== userId) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "FORBIDDEN", message: "アクセス権限がありません" },
        },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      data: formatMealForResponse(meal, true),
    });
  } catch (error) {
    console.error("GET /api/v1/meals/:id error:", error);
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
 * PUT /api/v1/meals/:id
 * 食事記録更新
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

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
    const mealId = parseInt(id, 10);

    if (isNaN(mealId)) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "VALIDATION_ERROR", message: "IDが不正です" },
        },
        { status: 422 }
      );
    }

    // 既存の食事記録確認
    const existingMeal = await prisma.mealRecord.findUnique({
      where: { id: mealId },
    });

    if (!existingMeal) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "NOT_FOUND", message: "食事記録が見つかりません" },
        },
        { status: 404 }
      );
    }

    // 所有者チェック
    if (existingMeal.userId !== userId) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "FORBIDDEN", message: "アクセス権限がありません" },
        },
        { status: 403 }
      );
    }

    // リクエストボディ取得
    const body = await request.json();

    // snake_case → camelCase 変換
    const transformedBody = {
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
    const validationResult = mealUpdateSchema.safeParse(transformedBody);
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

    const { mealType, memo, items } = validationResult.data;

    // 更新データ準備
    const updateData: {
      mealType?: MealType;
      memo?: string | null;
    } = {};

    if (mealType !== undefined) {
      updateData.mealType = mealType;
    }
    if (memo !== undefined) {
      updateData.memo = memo;
    }

    // 食品リストが指定された場合は全置換
    if (items) {
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

      // トランザクションで更新
      const meal = await prisma.$transaction(async (tx) => {
        // 既存の明細を削除
        await tx.mealItem.deleteMany({
          where: { mealRecordId: mealId },
        });

        // 食事記録更新
        return tx.mealRecord.update({
          where: { id: mealId },
          data: {
            ...updateData,
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
      });

      return NextResponse.json({
        success: true,
        data: formatMealForResponse(meal),
      });
    }

    // 食品リストなしの更新
    const meal = await prisma.mealRecord.update({
      where: { id: mealId },
      data: updateData,
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

    return NextResponse.json({
      success: true,
      data: formatMealForResponse(meal),
    });
  } catch (error) {
    console.error("PUT /api/v1/meals/:id error:", error);
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
 * DELETE /api/v1/meals/:id
 * 食事記録削除
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

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
    const mealId = parseInt(id, 10);

    if (isNaN(mealId)) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "VALIDATION_ERROR", message: "IDが不正です" },
        },
        { status: 422 }
      );
    }

    // 既存の食事記録確認
    const existingMeal = await prisma.mealRecord.findUnique({
      where: { id: mealId },
    });

    if (!existingMeal) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "NOT_FOUND", message: "食事記録が見つかりません" },
        },
        { status: 404 }
      );
    }

    // 所有者チェック
    if (existingMeal.userId !== userId) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "FORBIDDEN", message: "アクセス権限がありません" },
        },
        { status: 403 }
      );
    }

    // 削除（MealItemsはonDelete: Cascadeで自動削除）
    await prisma.mealRecord.delete({
      where: { id: mealId },
    });

    return NextResponse.json({
      success: true,
      data: { message: "食事記録を削除しました" },
    });
  } catch (error) {
    console.error("DELETE /api/v1/meals/:id error:", error);
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
