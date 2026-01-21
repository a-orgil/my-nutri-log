import { NextResponse } from "next/server";
import { auth } from "@/../auth";
import { prisma } from "@/lib/prisma";
import {
  foodFormSchema,
  foodSearchQuerySchema,
  formatFoodForResponse,
} from "@/lib/foods";

// GET /api/v1/foods - 食品一覧取得
export async function GET(request: Request) {
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

    // クエリパラメータの取得とバリデーション
    const { searchParams } = new URL(request.url);
    const queryParams = {
      q: searchParams.get("q") || undefined,
      page: searchParams.get("page") || undefined,
      limit: searchParams.get("limit") || undefined,
    };

    const parsed = foodSearchQuerySchema.safeParse(queryParams);
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: parsed.error.issues[0]?.message || "バリデーションエラー",
          },
        },
        { status: 422 }
      );
    }

    const { q, page, limit } = parsed.data;
    const skip = (page - 1) * limit;

    // 検索条件: ユーザーの食品 OR デフォルト食品（userId IS NULL）
    const whereCondition = {
      AND: [
        {
          OR: [{ userId: userId }, { userId: null }],
        },
        q
          ? {
              name: {
                contains: q,
                mode: "insensitive" as const,
              },
            }
          : {},
      ],
    };

    // データ取得と件数取得を並列実行
    const [foods, totalCount] = await Promise.all([
      prisma.foodMaster.findMany({
        where: whereCondition,
        orderBy: { updatedAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.foodMaster.count({
        where: whereCondition,
      }),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      success: true,
      data: {
        foods: foods.map(formatFoodForResponse),
        pagination: {
          current_page: page,
          total_pages: totalPages,
          total_count: totalCount,
          limit,
        },
      },
    });
  } catch (error) {
    console.error("Foods list error:", error);
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

// POST /api/v1/foods - 食品登録
export async function POST(request: Request) {
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

    const body = await request.json();
    const parsed = foodFormSchema.safeParse(body);

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

    const {
      name,
      calories,
      protein,
      fat,
      carbohydrate,
      servingSize,
      servingUnit,
    } = parsed.data;

    const food = await prisma.foodMaster.create({
      data: {
        userId,
        name,
        calories,
        protein,
        fat,
        carbohydrate,
        servingSize,
        servingUnit,
        isDefault: false,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: formatFoodForResponse(food),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Food create error:", error);
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
