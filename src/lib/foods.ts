import { z } from "zod";
import type { FoodMaster } from "@prisma/client";

// 単位のEnum
export const servingUnits = ["g", "ml", "個", "杯", "枚"] as const;
export type ServingUnit = (typeof servingUnits)[number];

// 食品名スキーマ
export const foodNameSchema = z
  .string()
  .min(1, "食品名は必須です")
  .max(200, "食品名は200文字以内で入力してください");

// 数値スキーマ（カロリー・PFC用）
export const nutritionValueSchema = z
  .number({ error: "数値を入力してください" })
  .min(0, "0以上の値を入力してください")
  .max(99999.99, "値が大きすぎます");

// 基準量スキーマ
export const servingSizeSchema = z
  .number({ error: "数値を入力してください" })
  .min(0.01, "基準量は0より大きい値を入力してください")
  .max(99999.99, "値が大きすぎます");

// 単位スキーマ
export const servingUnitSchema = z.enum(servingUnits, {
  error: "有効な単位を選択してください",
});

// 食品登録フォームスキーマ
export const foodFormSchema = z.object({
  name: foodNameSchema,
  calories: nutritionValueSchema,
  protein: nutritionValueSchema,
  fat: nutritionValueSchema,
  carbohydrate: nutritionValueSchema,
  servingSize: servingSizeSchema,
  servingUnit: servingUnitSchema,
});

// 食品更新スキーマ（部分更新対応）
export const foodUpdateSchema = foodFormSchema.partial();

// 検索クエリスキーマ
export const foodSearchQuerySchema = z.object({
  q: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

// 型エクスポート
export type FoodFormInput = z.infer<typeof foodFormSchema>;
export type FoodUpdateInput = z.infer<typeof foodUpdateSchema>;
export type FoodSearchQuery = z.infer<typeof foodSearchQuerySchema>;

// APIレスポンス用の食品型
export interface Food {
  id: number;
  user_id: number | null;
  name: string;
  calories: number;
  protein: number;
  fat: number;
  carbohydrate: number;
  serving_size: number;
  serving_unit: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

// 一覧APIレスポンス
export interface FoodsListResponse {
  foods: Food[];
  pagination: {
    current_page: number;
    total_pages: number;
    total_count: number;
    limit: number;
  };
}

// Decimal型からnumber型への変換・snake_caseフォーマット
export function formatFoodForResponse(food: FoodMaster): Food {
  return {
    id: food.id,
    user_id: food.userId,
    name: food.name,
    calories: Number(food.calories),
    protein: Number(food.protein),
    fat: Number(food.fat),
    carbohydrate: Number(food.carbohydrate),
    serving_size: Number(food.servingSize),
    serving_unit: food.servingUnit,
    is_default: food.isDefault,
    created_at: food.createdAt.toISOString(),
    updated_at: food.updatedAt.toISOString(),
  };
}

// PFCバランス計算ユーティリティ
export function calculatePFCPercentage(
  protein: number,
  fat: number,
  carbohydrate: number
): { protein: number; fat: number; carbohydrate: number } {
  const proteinCalories = protein * 4;
  const fatCalories = fat * 9;
  const carbCalories = carbohydrate * 4;
  const totalCalories = proteinCalories + fatCalories + carbCalories;

  if (totalCalories === 0) {
    return { protein: 0, fat: 0, carbohydrate: 0 };
  }

  return {
    protein: Math.round((proteinCalories / totalCalories) * 100),
    fat: Math.round((fatCalories / totalCalories) * 100),
    carbohydrate: Math.round((carbCalories / totalCalories) * 100),
  };
}
