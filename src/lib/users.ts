import { z } from "zod";

// ========================================
// バリデーションスキーマ
// ========================================

// ユーザー名スキーマ
export const userNameSchema = z
  .string()
  .min(1, "ユーザー名は必須です")
  .max(100, "ユーザー名は100文字以内で入力してください");

// メールアドレススキーマ
export const emailSchema = z
  .string()
  .min(1, "メールアドレスは必須です")
  .email("有効なメールアドレスを入力してください")
  .max(255, "メールアドレスは255文字以内で入力してください");

// パスワードスキーマ
export const passwordSchema = z
  .string()
  .min(8, "パスワードは8文字以上で入力してください");

// ユーザー情報更新スキーマ
export const userUpdateSchema = z.object({
  name: userNameSchema.optional(),
  email: emailSchema.optional(),
});

// パスワード変更スキーマ
export const passwordChangeSchema = z.object({
  currentPassword: passwordSchema,
  newPassword: passwordSchema,
});

// 目標値スキーマ
export const targetCalorieSchema = z
  .number({ error: "数値を入力してください" })
  .int("整数を入力してください")
  .min(500, "目標カロリーは500以上を入力してください")
  .max(10000, "目標カロリーは10000以下を入力してください");

export const targetProteinSchema = z
  .number({ error: "数値を入力してください" })
  .int("整数を入力してください")
  .min(1, "目標タンパク質は1以上を入力してください")
  .max(500, "目標タンパク質は500以下を入力してください");

export const targetFatSchema = z
  .number({ error: "数値を入力してください" })
  .int("整数を入力してください")
  .min(1, "目標脂質は1以上を入力してください")
  .max(500, "目標脂質は500以下を入力してください");

export const targetCarbSchema = z
  .number({ error: "数値を入力してください" })
  .int("整数を入力してください")
  .min(1, "目標炭水化物は1以上を入力してください")
  .max(1000, "目標炭水化物は1000以下を入力してください");

// 目標値更新スキーマ
export const targetsUpdateSchema = z.object({
  dailyCalorieTarget: targetCalorieSchema.optional(),
  dailyProteinTarget: targetProteinSchema.optional(),
  dailyFatTarget: targetFatSchema.optional(),
  dailyCarbTarget: targetCarbSchema.optional(),
});

// 目標値フォームスキーマ（全項目必須）
export const targetsFormSchema = z.object({
  dailyCalorieTarget: targetCalorieSchema,
  dailyProteinTarget: targetProteinSchema,
  dailyFatTarget: targetFatSchema,
  dailyCarbTarget: targetCarbSchema,
});

// ========================================
// 型定義
// ========================================

export type UserUpdateInput = z.infer<typeof userUpdateSchema>;
export type PasswordChangeInput = z.infer<typeof passwordChangeSchema>;
export type TargetsUpdateInput = z.infer<typeof targetsUpdateSchema>;
export type TargetsFormInput = z.infer<typeof targetsFormSchema>;

// ユーザー情報（APIレスポンス用）
export interface UserResponse {
  id: number;
  name: string;
  email: string;
  daily_calorie_target: number;
  daily_protein_target: number;
  daily_fat_target: number;
  daily_carb_target: number;
  created_at: string;
  updated_at: string;
}

// 目標値（APIレスポンス用）
export interface TargetsResponse {
  daily_calorie_target: number;
  daily_protein_target: number;
  daily_fat_target: number;
  daily_carb_target: number;
  updated_at: string;
}

// ========================================
// フォーマットユーティリティ
// ========================================

/**
 * ユーザー情報をAPIレスポンス形式に変換する
 */
export function formatUserForResponse(user: {
  id: number;
  name: string;
  email: string;
  dailyCalorieTarget: number | null;
  dailyProteinTarget: number | null;
  dailyFatTarget: number | null;
  dailyCarbTarget: number | null;
  createdAt: Date;
  updatedAt: Date;
}): UserResponse {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    daily_calorie_target: user.dailyCalorieTarget ?? 2000,
    daily_protein_target: user.dailyProteinTarget ?? 60,
    daily_fat_target: user.dailyFatTarget ?? 55,
    daily_carb_target: user.dailyCarbTarget ?? 300,
    created_at: user.createdAt.toISOString(),
    updated_at: user.updatedAt.toISOString(),
  };
}

/**
 * 目標値をAPIレスポンス形式に変換する
 */
export function formatTargetsForResponse(user: {
  dailyCalorieTarget: number | null;
  dailyProteinTarget: number | null;
  dailyFatTarget: number | null;
  dailyCarbTarget: number | null;
  updatedAt: Date;
}): TargetsResponse {
  return {
    daily_calorie_target: user.dailyCalorieTarget ?? 2000,
    daily_protein_target: user.dailyProteinTarget ?? 60,
    daily_fat_target: user.dailyFatTarget ?? 55,
    daily_carb_target: user.dailyCarbTarget ?? 300,
    updated_at: user.updatedAt.toISOString(),
  };
}
