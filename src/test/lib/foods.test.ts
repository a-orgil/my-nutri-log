import { describe, it, expect } from "vitest";
import {
  foodFormSchema,
  foodUpdateSchema,
  foodSearchQuerySchema,
  foodNameSchema,
  nutritionValueSchema,
  servingSizeSchema,
  servingUnitSchema,
  calculatePFCPercentage,
} from "@/lib/foods";

describe("foodNameSchema", () => {
  it("正常な食品名を受け入れる", () => {
    const result = foodNameSchema.safeParse("鶏むね肉");
    expect(result.success).toBe(true);
  });

  it("空の食品名を拒否する", () => {
    const result = foodNameSchema.safeParse("");
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("食品名は必須です");
    }
  });

  it("200文字の食品名を受け入れる", () => {
    const name = "あ".repeat(200);
    const result = foodNameSchema.safeParse(name);
    expect(result.success).toBe(true);
  });

  it("201文字の食品名を拒否する", () => {
    const name = "あ".repeat(201);
    const result = foodNameSchema.safeParse(name);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(
        "食品名は200文字以内で入力してください"
      );
    }
  });
});

describe("nutritionValueSchema", () => {
  it("正の数を受け入れる", () => {
    const result = nutritionValueSchema.safeParse(100);
    expect(result.success).toBe(true);
  });

  it("0を受け入れる", () => {
    const result = nutritionValueSchema.safeParse(0);
    expect(result.success).toBe(true);
  });

  it("小数を受け入れる", () => {
    const result = nutritionValueSchema.safeParse(10.5);
    expect(result.success).toBe(true);
  });

  it("負の数を拒否する", () => {
    const result = nutritionValueSchema.safeParse(-1);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(
        "0以上の値を入力してください"
      );
    }
  });

  it("文字列を拒否する", () => {
    const result = nutritionValueSchema.safeParse("abc");
    expect(result.success).toBe(false);
  });
});

describe("servingSizeSchema", () => {
  it("1以上の値を受け入れる", () => {
    const result = servingSizeSchema.safeParse(100);
    expect(result.success).toBe(true);
  });

  it("0.01を受け入れる", () => {
    const result = servingSizeSchema.safeParse(0.01);
    expect(result.success).toBe(true);
  });

  it("0を拒否する", () => {
    const result = servingSizeSchema.safeParse(0);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(
        "基準量は0より大きい値を入力してください"
      );
    }
  });

  it("負の数を拒否する", () => {
    const result = servingSizeSchema.safeParse(-1);
    expect(result.success).toBe(false);
  });
});

describe("servingUnitSchema", () => {
  it("有効な単位を受け入れる", () => {
    const units = ["g", "ml", "個", "杯", "枚"];
    units.forEach((unit) => {
      const result = servingUnitSchema.safeParse(unit);
      expect(result.success).toBe(true);
    });
  });

  it("無効な単位を拒否する", () => {
    const result = servingUnitSchema.safeParse("invalid");
    expect(result.success).toBe(false);
  });
});

describe("foodFormSchema", () => {
  const validData = {
    name: "鶏むね肉",
    calories: 165,
    protein: 31,
    fat: 4,
    carbohydrate: 0,
    servingSize: 100,
    servingUnit: "g" as const,
  };

  it("正常なデータを受け入れる", () => {
    const result = foodFormSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it("必須項目が欠けている場合は拒否する", () => {
    const { name: _name, ...dataWithoutName } = validData;
    const result = foodFormSchema.safeParse(dataWithoutName);
    expect(result.success).toBe(false);
  });

  it("カロリーが負の数の場合は拒否する", () => {
    const result = foodFormSchema.safeParse({
      ...validData,
      calories: -1,
    });
    expect(result.success).toBe(false);
  });

  it("タンパク質が負の数の場合は拒否する", () => {
    const result = foodFormSchema.safeParse({
      ...validData,
      protein: -1,
    });
    expect(result.success).toBe(false);
  });

  it("脂質が負の数の場合は拒否する", () => {
    const result = foodFormSchema.safeParse({
      ...validData,
      fat: -1,
    });
    expect(result.success).toBe(false);
  });

  it("炭水化物が負の数の場合は拒否する", () => {
    const result = foodFormSchema.safeParse({
      ...validData,
      carbohydrate: -1,
    });
    expect(result.success).toBe(false);
  });

  it("基準量が0の場合は拒否する", () => {
    const result = foodFormSchema.safeParse({
      ...validData,
      servingSize: 0,
    });
    expect(result.success).toBe(false);
  });
});

describe("foodUpdateSchema", () => {
  it("部分的なデータを受け入れる", () => {
    const result = foodUpdateSchema.safeParse({ name: "更新後の名前" });
    expect(result.success).toBe(true);
  });

  it("空のオブジェクトを受け入れる", () => {
    const result = foodUpdateSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("バリデーションは引き続き適用される", () => {
    const result = foodUpdateSchema.safeParse({ calories: -1 });
    expect(result.success).toBe(false);
  });
});

describe("foodSearchQuerySchema", () => {
  it("デフォルト値を適用する", () => {
    const result = foodSearchQuerySchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(1);
      expect(result.data.limit).toBe(20);
    }
  });

  it("検索キーワードを受け入れる", () => {
    const result = foodSearchQuerySchema.safeParse({ q: "鶏肉" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.q).toBe("鶏肉");
    }
  });

  it("文字列のページ番号を数値に変換する", () => {
    const result = foodSearchQuerySchema.safeParse({ page: "2" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(2);
    }
  });

  it("文字列のlimitを数値に変換する", () => {
    const result = foodSearchQuerySchema.safeParse({ limit: "50" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.limit).toBe(50);
    }
  });

  it("limitの上限を超えた場合はエラーを返す", () => {
    const result = foodSearchQuerySchema.safeParse({ limit: 101 });
    expect(result.success).toBe(false);
  });

  it("pageが0以下の場合はエラーを返す", () => {
    const result = foodSearchQuerySchema.safeParse({ page: 0 });
    expect(result.success).toBe(false);
  });
});

describe("calculatePFCPercentage", () => {
  it("正常にPFCパーセンテージを計算する", () => {
    // P: 20g * 4 = 80kcal
    // F: 10g * 9 = 90kcal
    // C: 30g * 4 = 120kcal
    // Total: 290kcal
    // P: 80/290 = 27.6% -> 28%
    // F: 90/290 = 31.0% -> 31%
    // C: 120/290 = 41.4% -> 41%
    const result = calculatePFCPercentage(20, 10, 30);
    expect(result.protein).toBe(28);
    expect(result.fat).toBe(31);
    expect(result.carbohydrate).toBe(41);
  });

  it("全て0の場合は0%を返す", () => {
    const result = calculatePFCPercentage(0, 0, 0);
    expect(result.protein).toBe(0);
    expect(result.fat).toBe(0);
    expect(result.carbohydrate).toBe(0);
  });

  it("タンパク質のみの場合は100%を返す", () => {
    const result = calculatePFCPercentage(25, 0, 0);
    expect(result.protein).toBe(100);
    expect(result.fat).toBe(0);
    expect(result.carbohydrate).toBe(0);
  });

  it("脂質のみの場合は100%を返す", () => {
    const result = calculatePFCPercentage(0, 10, 0);
    expect(result.protein).toBe(0);
    expect(result.fat).toBe(100);
    expect(result.carbohydrate).toBe(0);
  });

  it("炭水化物のみの場合は100%を返す", () => {
    const result = calculatePFCPercentage(0, 0, 50);
    expect(result.protein).toBe(0);
    expect(result.fat).toBe(0);
    expect(result.carbohydrate).toBe(100);
  });
});
