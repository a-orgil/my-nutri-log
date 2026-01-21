import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/../auth";
import { prisma } from "@/lib/prisma";
import { targetsUpdateSchema, formatTargetsForResponse } from "@/lib/users";

/**
 * GET /api/v1/users/me/targets
 * 目標値取得
 */
export async function GET() {
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

    // ユーザー情報取得
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        dailyCalorieTarget: true,
        dailyProteinTarget: true,
        dailyFatTarget: true,
        dailyCarbTarget: true,
        updatedAt: true,
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

    return NextResponse.json({
      success: true,
      data: formatTargetsForResponse(user),
    });
  } catch (error) {
    console.error("GET /api/v1/users/me/targets error:", error);
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
 * PUT /api/v1/users/me/targets
 * 目標値更新
 */
export async function PUT(request: NextRequest) {
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

    // リクエストボディを取得
    const body = await request.json();

    // バリデーション
    const validationResult = targetsUpdateSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message:
              validationResult.error.issues[0]?.message ||
              "入力内容に誤りがあります",
          },
        },
        { status: 422 }
      );
    }

    const {
      dailyCalorieTarget,
      dailyProteinTarget,
      dailyFatTarget,
      dailyCarbTarget,
    } = validationResult.data;

    // 更新データを作成
    const updateData: {
      dailyCalorieTarget?: number;
      dailyProteinTarget?: number;
      dailyFatTarget?: number;
      dailyCarbTarget?: number;
    } = {};

    if (dailyCalorieTarget !== undefined)
      updateData.dailyCalorieTarget = dailyCalorieTarget;
    if (dailyProteinTarget !== undefined)
      updateData.dailyProteinTarget = dailyProteinTarget;
    if (dailyFatTarget !== undefined)
      updateData.dailyFatTarget = dailyFatTarget;
    if (dailyCarbTarget !== undefined)
      updateData.dailyCarbTarget = dailyCarbTarget;

    // 目標値更新
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        dailyCalorieTarget: true,
        dailyProteinTarget: true,
        dailyFatTarget: true,
        dailyCarbTarget: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: formatTargetsForResponse(updatedUser),
    });
  } catch (error) {
    console.error("PUT /api/v1/users/me/targets error:", error);
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
