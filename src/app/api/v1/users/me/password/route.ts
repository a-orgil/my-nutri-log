import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/../auth";
import { prisma } from "@/lib/prisma";
import { passwordChangeSchema } from "@/lib/users";
import { verifyPassword, hashPassword } from "@/lib/auth";

/**
 * PUT /api/v1/users/me/password
 * パスワード変更
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
    const validationResult = passwordChangeSchema.safeParse(body);
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

    const { currentPassword, newPassword } = validationResult.data;

    // ユーザー情報取得
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        passwordHash: true,
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

    // 現在のパスワードを検証
    const isValidPassword = await verifyPassword(
      currentPassword,
      user.passwordHash
    );

    if (!isValidPassword) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_CREDENTIALS",
            message: "現在のパスワードが正しくありません",
          },
        },
        { status: 401 }
      );
    }

    // 新しいパスワードをハッシュ化
    const newPasswordHash = await hashPassword(newPassword);

    // パスワード更新
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newPasswordHash },
    });

    return NextResponse.json({
      success: true,
      data: {
        message: "パスワードを変更しました",
      },
    });
  } catch (error) {
    console.error("PUT /api/v1/users/me/password error:", error);
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
