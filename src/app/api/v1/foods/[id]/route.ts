import { NextResponse } from "next/server";
import { auth } from "@/../auth";
import { prisma } from "@/lib/prisma";
import { foodUpdateSchema, formatFoodForResponse } from "@/lib/foods";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/v1/foods/:id - 食品詳細取得
export async function GET(_request: Request, { params }: RouteParams) {
  try {
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
    const { id } = await params;
    const foodId = parseInt(id, 10);

    if (isNaN(foodId)) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "VALIDATION_ERROR", message: "無効なIDです" },
        },
        { status: 422 }
      );
    }

    const food = await prisma.foodMaster.findUnique({
      where: { id: foodId },
    });

    if (!food) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "NOT_FOUND", message: "食品が見つかりません" },
        },
        { status: 404 }
      );
    }

    // 所有者チェック: 自分の食品 OR デフォルト食品
    if (food.userId !== null && food.userId !== userId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "FORBIDDEN",
            message: "この食品にアクセスする権限がありません",
          },
        },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      data: formatFoodForResponse(food),
    });
  } catch (error) {
    console.error("Food get error:", error);
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

// PUT /api/v1/foods/:id - 食品更新
export async function PUT(request: Request, { params }: RouteParams) {
  try {
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
    const { id } = await params;
    const foodId = parseInt(id, 10);

    if (isNaN(foodId)) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "VALIDATION_ERROR", message: "無効なIDです" },
        },
        { status: 422 }
      );
    }

    const food = await prisma.foodMaster.findUnique({
      where: { id: foodId },
    });

    if (!food) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "NOT_FOUND", message: "食品が見つかりません" },
        },
        { status: 404 }
      );
    }

    // 所有者チェック: 自分の食品のみ編集可能
    if (food.userId !== userId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "FORBIDDEN",
            message: "この食品を編集する権限がありません",
          },
        },
        { status: 403 }
      );
    }

    // デフォルト食品は編集不可
    if (food.isDefault) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "FORBIDDEN",
            message: "デフォルト食品は編集できません",
          },
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const parsed = foodUpdateSchema.safeParse(body);

    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0];
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: firstIssue?.message || "バリデーションエラー",
          },
        },
        { status: 422 }
      );
    }

    const updatedFood = await prisma.foodMaster.update({
      where: { id: foodId },
      data: parsed.data,
    });

    return NextResponse.json({
      success: true,
      data: formatFoodForResponse(updatedFood),
    });
  } catch (error) {
    console.error("Food update error:", error);
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

// DELETE /api/v1/foods/:id - 食品削除
export async function DELETE(_request: Request, { params }: RouteParams) {
  try {
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
    const { id } = await params;
    const foodId = parseInt(id, 10);

    if (isNaN(foodId)) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "VALIDATION_ERROR", message: "無効なIDです" },
        },
        { status: 422 }
      );
    }

    const food = await prisma.foodMaster.findUnique({
      where: { id: foodId },
    });

    if (!food) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "NOT_FOUND", message: "食品が見つかりません" },
        },
        { status: 404 }
      );
    }

    // 所有者チェック: 自分の食品のみ削除可能
    if (food.userId !== userId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "FORBIDDEN",
            message: "この食品を削除する権限がありません",
          },
        },
        { status: 403 }
      );
    }

    // デフォルト食品は削除不可
    if (food.isDefault) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "FORBIDDEN",
            message: "デフォルト食品は削除できません",
          },
        },
        { status: 403 }
      );
    }

    // 使用中チェック: MealItemで参照されていないか確認
    const mealItemCount = await prisma.mealItem.count({
      where: { foodMasterId: foodId },
    });

    if (mealItemCount > 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "FOOD_IN_USE",
            message: "この食品は食事記録で使用されているため削除できません",
          },
        },
        { status: 400 }
      );
    }

    await prisma.foodMaster.delete({
      where: { id: foodId },
    });

    return NextResponse.json({
      success: true,
      data: { message: "食品を削除しました" },
    });
  } catch (error) {
    console.error("Food delete error:", error);
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
