import { z } from "zod";
import { Decimal } from "@prisma/client/runtime/library";

// ========================================
// 定数
// ========================================

export const mealTypes = ["breakfast", "lunch", "dinner", "snack"] as const;

export const mealTypeLabels: Record<(typeof mealTypes)[number], string> = {
  breakfast: "朝食",
  lunch: "昼食",
  dinner: "夕食",
  snack: "間食",
};

// ========================================
// バリデーションスキーマ
// ========================================

// 日付スキーマ（YYYY-MM-DD形式）
const dateStringSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "日付はYYYY-MM-DD形式で入力してください")
  .refine(
    (val) => {
      const date = new Date(val);
      return !isNaN(date.getTime());
    },
    { message: "有効な日付を入力してください" }
  );

// 食事タイプスキーマ
export const mealTypeSchema = z.enum(mealTypes, {
  error: "有効な食事タイプを選択してください",
});

// メモスキーマ
const memoSchema = z
  .string()
  .max(500, "メモは500文字以内で入力してください")
  .optional()
  .nullable();

// 数量スキーマ（0.1以上）
export const quantitySchema = z
  .number({ error: "数値を入力してください" })
  .min(0.1, "数量は0.1以上を入力してください");

// 食品IDスキーマ
const foodIdSchema = z
  .number({ error: "食品IDを入力してください" })
  .int("食品IDは整数を入力してください")
  .positive("食品IDは正の整数を入力してください");

// 食事明細アイテムスキーマ
export const mealItemInputSchema = z.object({
  foodId: foodIdSchema,
  quantity: quantitySchema,
});

// 食事記録作成スキーマ
export const mealFormSchema = z.object({
  recordDate: dateStringSchema,
  mealType: mealTypeSchema,
  memo: memoSchema,
  items: z.array(mealItemInputSchema).min(1, "食品を1つ以上追加してください"),
});

// 食事記録更新スキーマ
export const mealUpdateSchema = z.object({
  mealType: mealTypeSchema.optional(),
  memo: memoSchema,
  items: z
    .array(mealItemInputSchema)
    .min(1, "食品を1つ以上追加してください")
    .optional(),
});

// 検索クエリスキーマ
export const mealSearchQuerySchema = z.object({
  date: dateStringSchema.optional(),
  startDate: dateStringSchema.optional(),
  endDate: dateStringSchema.optional(),
  mealType: mealTypeSchema.optional(),
});

// 日次サマリークエリスキーマ
export const dailySummaryQuerySchema = z.object({
  date: dateStringSchema,
});

// 月次サマリークエリスキーマ
export const monthlySummaryQuerySchema = z.object({
  year: z
    .string()
    .regex(/^\d{4}$/, "年は4桁の数値を入力してください")
    .transform((val) => parseInt(val, 10)),
  month: z
    .string()
    .regex(/^([1-9]|1[0-2])$/, "月は1-12の数値を入力してください")
    .transform((val) => parseInt(val, 10)),
});

// ========================================
// 型定義
// ========================================

export type MealType = (typeof mealTypes)[number];
export type MealFormInput = z.infer<typeof mealFormSchema>;
export type MealUpdateInput = z.infer<typeof mealUpdateSchema>;
export type MealItemInput = z.infer<typeof mealItemInputSchema>;
export type MealSearchQuery = z.infer<typeof mealSearchQuerySchema>;

// 栄養素の型
export interface Nutrition {
  calories: number;
  protein: number;
  fat: number;
  carbohydrate: number;
}

// 食品情報（フロントエンド用）
export interface FoodInfo {
  id: number;
  name: string;
  calories: number;
  protein: number;
  fat: number;
  carbohydrate: number;
  servingSize: number;
  servingUnit: string;
}

// 食事明細（フロントエンド用）
export interface MealItemResponse {
  id: number;
  food: {
    id: number;
    name: string;
    servingUnit: string;
  };
  quantity: number;
  calories: number;
  protein: number;
  fat: number;
  carbohydrate: number;
}

// 食事記録（フロントエンド用）
export interface MealResponse {
  id: number;
  recordDate: string;
  mealType: MealType;
  memo: string | null;
  items: MealItemResponse[];
  totals: Nutrition;
  createdAt: string;
  updatedAt: string;
}

// 食事記録詳細（フロントエンド用）
export interface MealDetailResponse extends MealResponse {
  items: Array<
    MealItemResponse & {
      food: FoodInfo;
    }
  >;
}

// 日次サマリー
export interface DailySummary {
  date: string;
  totals: Nutrition;
  targets: Nutrition;
  achievement: {
    calories: number;
    protein: number;
    fat: number;
    carbohydrate: number;
  };
  byMealType: {
    breakfast: Nutrition;
    lunch: Nutrition;
    dinner: Nutrition;
    snack: Nutrition;
  };
}

// 月次サマリー
export interface MonthlySummary {
  year: number;
  month: number;
  targets: Nutrition;
  dailySummaries: Array<{
    date: string;
    calories: number;
    protein: number;
    fat: number;
    carbohydrate: number;
    hasRecords: boolean;
  }>;
  monthlyAverage: Nutrition;
}

// ========================================
// 栄養計算ユーティリティ
// ========================================

/**
 * 食品の栄養素を数量に応じて計算する
 * @param food 食品マスタ情報
 * @param quantity 数量（倍率）
 * @returns 計算された栄養素（小数点2桁丸め）
 */
export function calculateNutrition(
  food: {
    calories: number | Decimal;
    protein: number | Decimal;
    fat: number | Decimal;
    carbohydrate: number | Decimal;
  },
  quantity: number
): Nutrition {
  const toNumber = (val: number | Decimal): number =>
    typeof val === "number" ? val : val.toNumber();

  return {
    calories: roundToTwoDecimals(toNumber(food.calories) * quantity),
    protein: roundToTwoDecimals(toNumber(food.protein) * quantity),
    fat: roundToTwoDecimals(toNumber(food.fat) * quantity),
    carbohydrate: roundToTwoDecimals(toNumber(food.carbohydrate) * quantity),
  };
}

/**
 * 複数の栄養素を合計する
 * @param nutritions 栄養素の配列
 * @returns 合計された栄養素
 */
export function sumNutrition(nutritions: Nutrition[]): Nutrition {
  const sum = nutritions.reduce(
    (acc, n) => ({
      calories: acc.calories + n.calories,
      protein: acc.protein + n.protein,
      fat: acc.fat + n.fat,
      carbohydrate: acc.carbohydrate + n.carbohydrate,
    }),
    { calories: 0, protein: 0, fat: 0, carbohydrate: 0 }
  );

  return {
    calories: roundToTwoDecimals(sum.calories),
    protein: roundToTwoDecimals(sum.protein),
    fat: roundToTwoDecimals(sum.fat),
    carbohydrate: roundToTwoDecimals(sum.carbohydrate),
  };
}

/**
 * 食事記録の合計を計算する
 * @param items 食事明細の配列
 * @returns 合計された栄養素
 */
export function calculateMealTotal(
  items: Array<{
    calories: number | Decimal;
    protein: number | Decimal;
    fat: number | Decimal;
    carbohydrate: number | Decimal;
  }>
): Nutrition {
  const toNumber = (val: number | Decimal): number =>
    typeof val === "number" ? val : val.toNumber();

  const nutritions = items.map((item) => ({
    calories: toNumber(item.calories),
    protein: toNumber(item.protein),
    fat: toNumber(item.fat),
    carbohydrate: toNumber(item.carbohydrate),
  }));

  return sumNutrition(nutritions);
}

/**
 * 達成率を計算する
 * @param actual 実績値
 * @param target 目標値
 * @returns 達成率（%）小数点1桁
 */
export function calculateAchievementRate(
  actual: number,
  target: number
): number {
  if (target <= 0) return 0;
  return Math.round((actual / target) * 1000) / 10;
}

/**
 * 小数点2桁に丸める
 */
function roundToTwoDecimals(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * 空の栄養素を返す
 */
export function emptyNutrition(): Nutrition {
  return { calories: 0, protein: 0, fat: 0, carbohydrate: 0 };
}

// ========================================
// フォーマットユーティリティ
// ========================================

/**
 * 食事明細をAPIレスポンス形式に変換する
 */
export function formatMealItemForResponse(
  item: {
    id: number;
    quantity: Decimal;
    calories: Decimal;
    protein: Decimal;
    fat: Decimal;
    carbohydrate: Decimal;
    foodMaster: {
      id: number;
      name: string;
      servingUnit: string;
      calories?: Decimal;
      protein?: Decimal;
      fat?: Decimal;
      carbohydrate?: Decimal;
      servingSize?: Decimal;
    };
  },
  includeFullFoodInfo = false
): MealItemResponse {
  const base = {
    id: item.id,
    food: {
      id: item.foodMaster.id,
      name: item.foodMaster.name,
      servingUnit: item.foodMaster.servingUnit,
    },
    quantity: item.quantity.toNumber(),
    calories: item.calories.toNumber(),
    protein: item.protein.toNumber(),
    fat: item.fat.toNumber(),
    carbohydrate: item.carbohydrate.toNumber(),
  };

  if (includeFullFoodInfo && item.foodMaster.calories !== undefined) {
    return {
      ...base,
      food: {
        ...base.food,
        calories: item.foodMaster.calories!.toNumber(),
        protein: item.foodMaster.protein!.toNumber(),
        fat: item.foodMaster.fat!.toNumber(),
        carbohydrate: item.foodMaster.carbohydrate!.toNumber(),
        servingSize: item.foodMaster.servingSize!.toNumber(),
      } as FoodInfo,
    };
  }

  return base;
}

/**
 * 食事記録をAPIレスポンス形式に変換する
 */
export function formatMealForResponse(
  meal: {
    id: number;
    recordDate: Date;
    mealType: MealType;
    memo: string | null;
    createdAt: Date;
    updatedAt: Date;
    mealItems: Array<{
      id: number;
      quantity: Decimal;
      calories: Decimal;
      protein: Decimal;
      fat: Decimal;
      carbohydrate: Decimal;
      foodMaster: {
        id: number;
        name: string;
        servingUnit: string;
        calories?: Decimal;
        protein?: Decimal;
        fat?: Decimal;
        carbohydrate?: Decimal;
        servingSize?: Decimal;
      };
    }>;
  },
  includeFullFoodInfo = false
): MealResponse {
  const items = meal.mealItems.map((item) =>
    formatMealItemForResponse(item, includeFullFoodInfo)
  );

  const totals = calculateMealTotal(meal.mealItems);

  return {
    id: meal.id,
    recordDate: formatDateToString(meal.recordDate),
    mealType: meal.mealType,
    memo: meal.memo,
    items,
    totals,
    createdAt: meal.createdAt.toISOString(),
    updatedAt: meal.updatedAt.toISOString(),
  };
}

/**
 * 日付をYYYY-MM-DD形式の文字列に変換する
 */
export function formatDateToString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * YYYY-MM-DD形式の文字列をDateに変換する
 */
export function parseStringToDate(dateString: string): Date {
  const [year, month, day] = dateString.split("-").map(Number);
  return new Date(year, month - 1, day);
}
