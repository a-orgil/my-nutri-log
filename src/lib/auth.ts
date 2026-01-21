import bcrypt from "bcryptjs";
import { z } from "zod";

const SALT_ROUNDS = 12;

/**
 * パスワードをハッシュ化する
 */
export async function hashPassword(password: string): Promise<string> {
  if (!password) {
    throw new Error("Password is required");
  }
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * パスワードを検証する
 */
export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  if (!password || !hashedPassword) {
    return false;
  }
  return bcrypt.compare(password, hashedPassword);
}

/**
 * メールバリデーションスキーマ
 */
export const emailSchema = z
  .string()
  .min(1, "メールアドレスは必須です")
  .email("有効なメールアドレスを入力してください")
  .regex(
    /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
    "有効なメールアドレスを入力してください"
  );

/**
 * パスワードバリデーションスキーマ
 */
export const passwordSchema = z
  .string()
  .min(8, "パスワードは8文字以上で入力してください");

/**
 * ユーザー名バリデーションスキーマ
 */
export const nameSchema = z
  .string()
  .min(1, "ユーザー名は必須です")
  .max(100, "ユーザー名は100文字以内で入力してください");

/**
 * ログインフォームスキーマ
 */
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "パスワードは必須です"),
});

/**
 * 新規登録フォームスキーマ
 */
export const registerSchema = z
  .object({
    name: nameSchema,
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string().min(1, "パスワード確認は必須です"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "パスワードが一致しません",
    path: ["confirmPassword"],
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
