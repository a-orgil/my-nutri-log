import { describe, it, expect } from "vitest";
import {
  userUpdateSchema,
  passwordChangeSchema,
  targetsUpdateSchema,
  targetsFormSchema,
  formatUserForResponse,
  formatTargetsForResponse,
} from "@/lib/users";

describe("ユーザー関連バリデーション", () => {
  describe("userUpdateSchema", () => {
    it("正常なデータを検証できること", () => {
      const result = userUpdateSchema.safeParse({
        name: "山田太郎",
        email: "test@example.com",
      });
      expect(result.success).toBe(true);
    });

    it("部分的な更新を許可すること（nameのみ）", () => {
      const result = userUpdateSchema.safeParse({
        name: "山田太郎",
      });
      expect(result.success).toBe(true);
    });

    it("部分的な更新を許可すること（emailのみ）", () => {
      const result = userUpdateSchema.safeParse({
        email: "test@example.com",
      });
      expect(result.success).toBe(true);
    });

    it("空のオブジェクトを許可すること", () => {
      const result = userUpdateSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it("不正なメールアドレスを拒否すること", () => {
      const result = userUpdateSchema.safeParse({
        email: "invalid-email",
      });
      expect(result.success).toBe(false);
    });

    it("空のユーザー名を拒否すること", () => {
      const result = userUpdateSchema.safeParse({
        name: "",
      });
      expect(result.success).toBe(false);
    });

    it("101文字以上のユーザー名を拒否すること", () => {
      const result = userUpdateSchema.safeParse({
        name: "a".repeat(101),
      });
      expect(result.success).toBe(false);
    });
  });

  describe("passwordChangeSchema", () => {
    it("正常なパスワード変更データを検証できること", () => {
      const result = passwordChangeSchema.safeParse({
        currentPassword: "password123",
        newPassword: "newpassword456",
      });
      expect(result.success).toBe(true);
    });

    it("8文字未満の現在のパスワードを拒否すること", () => {
      const result = passwordChangeSchema.safeParse({
        currentPassword: "short",
        newPassword: "newpassword456",
      });
      expect(result.success).toBe(false);
    });

    it("8文字未満の新しいパスワードを拒否すること", () => {
      const result = passwordChangeSchema.safeParse({
        currentPassword: "password123",
        newPassword: "short",
      });
      expect(result.success).toBe(false);
    });

    it("現在のパスワードが必須であること", () => {
      const result = passwordChangeSchema.safeParse({
        newPassword: "newpassword456",
      });
      expect(result.success).toBe(false);
    });

    it("新しいパスワードが必須であること", () => {
      const result = passwordChangeSchema.safeParse({
        currentPassword: "password123",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("targetsUpdateSchema", () => {
    it("正常な目標値データを検証できること", () => {
      const result = targetsUpdateSchema.safeParse({
        dailyCalorieTarget: 2000,
        dailyProteinTarget: 60,
        dailyFatTarget: 55,
        dailyCarbTarget: 300,
      });
      expect(result.success).toBe(true);
    });

    it("部分的な更新を許可すること", () => {
      const result = targetsUpdateSchema.safeParse({
        dailyCalorieTarget: 1800,
      });
      expect(result.success).toBe(true);
    });

    it("500未満のカロリーを拒否すること", () => {
      const result = targetsUpdateSchema.safeParse({
        dailyCalorieTarget: 499,
      });
      expect(result.success).toBe(false);
    });

    it("10000超のカロリーを拒否すること", () => {
      const result = targetsUpdateSchema.safeParse({
        dailyCalorieTarget: 10001,
      });
      expect(result.success).toBe(false);
    });

    it("1未満のタンパク質を拒否すること", () => {
      const result = targetsUpdateSchema.safeParse({
        dailyProteinTarget: 0,
      });
      expect(result.success).toBe(false);
    });

    it("500超のタンパク質を拒否すること", () => {
      const result = targetsUpdateSchema.safeParse({
        dailyProteinTarget: 501,
      });
      expect(result.success).toBe(false);
    });

    it("1未満の脂質を拒否すること", () => {
      const result = targetsUpdateSchema.safeParse({
        dailyFatTarget: 0,
      });
      expect(result.success).toBe(false);
    });

    it("500超の脂質を拒否すること", () => {
      const result = targetsUpdateSchema.safeParse({
        dailyFatTarget: 501,
      });
      expect(result.success).toBe(false);
    });

    it("1未満の炭水化物を拒否すること", () => {
      const result = targetsUpdateSchema.safeParse({
        dailyCarbTarget: 0,
      });
      expect(result.success).toBe(false);
    });

    it("1000超の炭水化物を拒否すること", () => {
      const result = targetsUpdateSchema.safeParse({
        dailyCarbTarget: 1001,
      });
      expect(result.success).toBe(false);
    });

    it("小数を拒否すること", () => {
      const result = targetsUpdateSchema.safeParse({
        dailyCalorieTarget: 2000.5,
      });
      expect(result.success).toBe(false);
    });
  });

  describe("targetsFormSchema", () => {
    it("すべての項目が必須であること", () => {
      const result = targetsFormSchema.safeParse({
        dailyCalorieTarget: 2000,
        dailyProteinTarget: 60,
        dailyFatTarget: 55,
      });
      expect(result.success).toBe(false);
    });

    it("すべての項目がある場合は検証成功すること", () => {
      const result = targetsFormSchema.safeParse({
        dailyCalorieTarget: 2000,
        dailyProteinTarget: 60,
        dailyFatTarget: 55,
        dailyCarbTarget: 300,
      });
      expect(result.success).toBe(true);
    });
  });
});

describe("フォーマットユーティリティ", () => {
  describe("formatUserForResponse", () => {
    it("ユーザー情報をsnake_case形式に変換できること", () => {
      const user = {
        id: 1,
        name: "山田太郎",
        email: "test@example.com",
        dailyCalorieTarget: 2000,
        dailyProteinTarget: 60,
        dailyFatTarget: 55,
        dailyCarbTarget: 300,
        createdAt: new Date("2026-01-01T00:00:00Z"),
        updatedAt: new Date("2026-01-01T00:00:00Z"),
      };

      const result = formatUserForResponse(user);

      expect(result).toEqual({
        id: 1,
        name: "山田太郎",
        email: "test@example.com",
        daily_calorie_target: 2000,
        daily_protein_target: 60,
        daily_fat_target: 55,
        daily_carb_target: 300,
        created_at: "2026-01-01T00:00:00.000Z",
        updated_at: "2026-01-01T00:00:00.000Z",
      });
    });

    it("null値をデフォルト値に変換すること", () => {
      const user = {
        id: 1,
        name: "山田太郎",
        email: "test@example.com",
        dailyCalorieTarget: null,
        dailyProteinTarget: null,
        dailyFatTarget: null,
        dailyCarbTarget: null,
        createdAt: new Date("2026-01-01T00:00:00Z"),
        updatedAt: new Date("2026-01-01T00:00:00Z"),
      };

      const result = formatUserForResponse(user);

      expect(result.daily_calorie_target).toBe(2000);
      expect(result.daily_protein_target).toBe(60);
      expect(result.daily_fat_target).toBe(55);
      expect(result.daily_carb_target).toBe(300);
    });
  });

  describe("formatTargetsForResponse", () => {
    it("目標値をsnake_case形式に変換できること", () => {
      const user = {
        dailyCalorieTarget: 1800,
        dailyProteinTarget: 80,
        dailyFatTarget: 50,
        dailyCarbTarget: 250,
        updatedAt: new Date("2026-01-01T00:00:00Z"),
      };

      const result = formatTargetsForResponse(user);

      expect(result).toEqual({
        daily_calorie_target: 1800,
        daily_protein_target: 80,
        daily_fat_target: 50,
        daily_carb_target: 250,
        updated_at: "2026-01-01T00:00:00.000Z",
      });
    });

    it("null値をデフォルト値に変換すること", () => {
      const user = {
        dailyCalorieTarget: null,
        dailyProteinTarget: null,
        dailyFatTarget: null,
        dailyCarbTarget: null,
        updatedAt: new Date("2026-01-01T00:00:00Z"),
      };

      const result = formatTargetsForResponse(user);

      expect(result.daily_calorie_target).toBe(2000);
      expect(result.daily_protein_target).toBe(60);
      expect(result.daily_fat_target).toBe(55);
      expect(result.daily_carb_target).toBe(300);
    });
  });
});
