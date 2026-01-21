import { describe, it, expect } from "vitest";
import {
  mealFormSchema,
  mealUpdateSchema,
  mealSearchQuerySchema,
  mealItemInputSchema,
  quantitySchema,
  mealTypeSchema,
  dailySummaryQuerySchema,
  monthlySummaryQuerySchema,
  calculateNutrition,
  sumNutrition,
  calculateMealTotal,
  calculateAchievementRate,
  emptyNutrition,
  formatDateToString,
  parseStringToDate,
} from "@/lib/meals";
import { Decimal } from "@prisma/client/runtime/library";

// ========================================
// バリデーションテスト
// ========================================

describe("mealTypeSchema", () => {
  it("有効な食事タイプを受け入れる", () => {
    expect(mealTypeSchema.safeParse("breakfast").success).toBe(true);
    expect(mealTypeSchema.safeParse("lunch").success).toBe(true);
    expect(mealTypeSchema.safeParse("dinner").success).toBe(true);
    expect(mealTypeSchema.safeParse("snack").success).toBe(true);
  });

  it("無効な食事タイプを拒否する", () => {
    expect(mealTypeSchema.safeParse("invalid").success).toBe(false);
    expect(mealTypeSchema.safeParse("").success).toBe(false);
    expect(mealTypeSchema.safeParse("BREAKFAST").success).toBe(false);
  });
});

describe("quantitySchema", () => {
  it("有効な数量を受け入れる", () => {
    expect(quantitySchema.safeParse(1).success).toBe(true);
    expect(quantitySchema.safeParse(0.1).success).toBe(true);
    expect(quantitySchema.safeParse(1.5).success).toBe(true);
    expect(quantitySchema.safeParse(10).success).toBe(true);
  });

  it("0.1未満の数量を拒否する", () => {
    expect(quantitySchema.safeParse(0).success).toBe(false);
    expect(quantitySchema.safeParse(0.05).success).toBe(false);
    expect(quantitySchema.safeParse(-1).success).toBe(false);
  });

  it("数値以外を拒否する", () => {
    expect(quantitySchema.safeParse("1").success).toBe(false);
    expect(quantitySchema.safeParse(null).success).toBe(false);
  });
});

describe("mealItemInputSchema", () => {
  it("有効な食品アイテムを受け入れる", () => {
    const validItem = { foodId: 1, quantity: 1.5 };
    expect(mealItemInputSchema.safeParse(validItem).success).toBe(true);
  });

  it("無効な食品IDを拒否する", () => {
    expect(
      mealItemInputSchema.safeParse({ foodId: 0, quantity: 1 }).success
    ).toBe(false);
    expect(
      mealItemInputSchema.safeParse({ foodId: -1, quantity: 1 }).success
    ).toBe(false);
    expect(
      mealItemInputSchema.safeParse({ foodId: 1.5, quantity: 1 }).success
    ).toBe(false);
  });

  it("無効な数量を拒否する", () => {
    expect(
      mealItemInputSchema.safeParse({ foodId: 1, quantity: 0 }).success
    ).toBe(false);
  });
});

describe("mealFormSchema", () => {
  it("有効な食事記録を受け入れる", () => {
    const validMeal = {
      recordDate: "2026-01-21",
      mealType: "breakfast",
      memo: "美味しかった",
      items: [{ foodId: 1, quantity: 1 }],
    };
    expect(mealFormSchema.safeParse(validMeal).success).toBe(true);
  });

  it("メモなしでも受け入れる", () => {
    const validMeal = {
      recordDate: "2026-01-21",
      mealType: "lunch",
      items: [{ foodId: 1, quantity: 1 }],
    };
    expect(mealFormSchema.safeParse(validMeal).success).toBe(true);
  });

  it("空のアイテムを拒否する", () => {
    const invalidMeal = {
      recordDate: "2026-01-21",
      mealType: "dinner",
      items: [],
    };
    expect(mealFormSchema.safeParse(invalidMeal).success).toBe(false);
  });

  it("無効な日付形式を拒否する", () => {
    const invalidMeal = {
      recordDate: "2026/01/21",
      mealType: "snack",
      items: [{ foodId: 1, quantity: 1 }],
    };
    expect(mealFormSchema.safeParse(invalidMeal).success).toBe(false);
  });

  it("500文字を超えるメモを拒否する", () => {
    const invalidMeal = {
      recordDate: "2026-01-21",
      mealType: "breakfast",
      memo: "a".repeat(501),
      items: [{ foodId: 1, quantity: 1 }],
    };
    expect(mealFormSchema.safeParse(invalidMeal).success).toBe(false);
  });
});

describe("mealUpdateSchema", () => {
  it("部分更新を受け入れる", () => {
    expect(mealUpdateSchema.safeParse({ mealType: "lunch" }).success).toBe(
      true
    );
    expect(mealUpdateSchema.safeParse({ memo: "更新" }).success).toBe(true);
    expect(
      mealUpdateSchema.safeParse({ items: [{ foodId: 1, quantity: 1 }] })
        .success
    ).toBe(true);
  });

  it("空のオブジェクトを受け入れる", () => {
    expect(mealUpdateSchema.safeParse({}).success).toBe(true);
  });

  it("アイテム指定時は1件以上必要", () => {
    expect(mealUpdateSchema.safeParse({ items: [] }).success).toBe(false);
  });
});

describe("mealSearchQuerySchema", () => {
  it("日付での検索を受け入れる", () => {
    expect(
      mealSearchQuerySchema.safeParse({ date: "2026-01-21" }).success
    ).toBe(true);
  });

  it("期間での検索を受け入れる", () => {
    const query = {
      startDate: "2026-01-01",
      endDate: "2026-01-31",
    };
    expect(mealSearchQuerySchema.safeParse(query).success).toBe(true);
  });

  it("食事タイプでの検索を受け入れる", () => {
    expect(
      mealSearchQuerySchema.safeParse({ mealType: "breakfast" }).success
    ).toBe(true);
  });

  it("空のクエリを受け入れる", () => {
    expect(mealSearchQuerySchema.safeParse({}).success).toBe(true);
  });
});

describe("dailySummaryQuerySchema", () => {
  it("有効な日付を受け入れる", () => {
    expect(
      dailySummaryQuerySchema.safeParse({ date: "2026-01-21" }).success
    ).toBe(true);
  });

  it("日付なしを拒否する", () => {
    expect(dailySummaryQuerySchema.safeParse({}).success).toBe(false);
  });
});

describe("monthlySummaryQuerySchema", () => {
  it("有効な年月を受け入れる", () => {
    const result = monthlySummaryQuerySchema.safeParse({
      year: "2026",
      month: "1",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.year).toBe(2026);
      expect(result.data.month).toBe(1);
    }
  });

  it("1-12の月を受け入れる", () => {
    expect(
      monthlySummaryQuerySchema.safeParse({ year: "2026", month: "12" }).success
    ).toBe(true);
  });

  it("無効な月を拒否する", () => {
    expect(
      monthlySummaryQuerySchema.safeParse({ year: "2026", month: "0" }).success
    ).toBe(false);
    expect(
      monthlySummaryQuerySchema.safeParse({ year: "2026", month: "13" }).success
    ).toBe(false);
  });
});

// ========================================
// 栄養計算テスト
// ========================================

describe("calculateNutrition", () => {
  const food = {
    calories: 100,
    protein: 10,
    fat: 5,
    carbohydrate: 15,
  };

  it("数量1.0で元の値を返す", () => {
    const result = calculateNutrition(food, 1.0);
    expect(result).toEqual({
      calories: 100,
      protein: 10,
      fat: 5,
      carbohydrate: 15,
    });
  });

  it("数量1.5で1.5倍の値を返す", () => {
    const result = calculateNutrition(food, 1.5);
    expect(result).toEqual({
      calories: 150,
      protein: 15,
      fat: 7.5,
      carbohydrate: 22.5,
    });
  });

  it("数量0.5で半分の値を返す", () => {
    const result = calculateNutrition(food, 0.5);
    expect(result).toEqual({
      calories: 50,
      protein: 5,
      fat: 2.5,
      carbohydrate: 7.5,
    });
  });

  it("小数点2桁に丸める", () => {
    const result = calculateNutrition(food, 0.33);
    expect(result.calories).toBe(33);
    expect(result.protein).toBe(3.3);
    expect(result.fat).toBe(1.65);
    expect(result.carbohydrate).toBe(4.95);
  });

  it("Decimal型も処理できる", () => {
    const decimalFood = {
      calories: new Decimal(100),
      protein: new Decimal(10),
      fat: new Decimal(5),
      carbohydrate: new Decimal(15),
    };
    const result = calculateNutrition(decimalFood, 1.0);
    expect(result).toEqual({
      calories: 100,
      protein: 10,
      fat: 5,
      carbohydrate: 15,
    });
  });
});

describe("sumNutrition", () => {
  it("複数の栄養素を合計する", () => {
    const nutritions = [
      { calories: 100, protein: 10, fat: 5, carbohydrate: 20 },
      { calories: 200, protein: 20, fat: 10, carbohydrate: 30 },
      { calories: 150, protein: 15, fat: 8, carbohydrate: 25 },
    ];
    const result = sumNutrition(nutritions);
    expect(result).toEqual({
      calories: 450,
      protein: 45,
      fat: 23,
      carbohydrate: 75,
    });
  });

  it("空の配列で0を返す", () => {
    const result = sumNutrition([]);
    expect(result).toEqual({
      calories: 0,
      protein: 0,
      fat: 0,
      carbohydrate: 0,
    });
  });

  it("小数点を含む合計を正しく計算する", () => {
    const nutritions = [
      { calories: 100.5, protein: 10.3, fat: 5.7, carbohydrate: 20.1 },
      { calories: 50.3, protein: 5.4, fat: 2.8, carbohydrate: 10.2 },
    ];
    const result = sumNutrition(nutritions);
    expect(result.calories).toBe(150.8);
    expect(result.protein).toBe(15.7);
    expect(result.fat).toBe(8.5);
    expect(result.carbohydrate).toBe(30.3);
  });
});

describe("calculateMealTotal", () => {
  it("食事明細の合計を計算する", () => {
    const items = [
      {
        calories: new Decimal(270),
        protein: new Decimal(4),
        fat: new Decimal(0.5),
        carbohydrate: new Decimal(59),
      },
      {
        calories: new Decimal(150),
        protein: new Decimal(12),
        fat: new Decimal(11),
        carbohydrate: new Decimal(0.5),
      },
    ];
    const result = calculateMealTotal(items);
    expect(result.calories).toBe(420);
    expect(result.protein).toBe(16);
    expect(result.fat).toBe(11.5);
    expect(result.carbohydrate).toBe(59.5);
  });

  it("空の配列で0を返す", () => {
    const result = calculateMealTotal([]);
    expect(result).toEqual({
      calories: 0,
      protein: 0,
      fat: 0,
      carbohydrate: 0,
    });
  });
});

describe("calculateAchievementRate", () => {
  it("100%達成を正しく計算する", () => {
    expect(calculateAchievementRate(2000, 2000)).toBe(100);
  });

  it("50%達成を正しく計算する", () => {
    expect(calculateAchievementRate(1000, 2000)).toBe(50);
  });

  it("超過を正しく計算する", () => {
    expect(calculateAchievementRate(2500, 2000)).toBe(125);
  });

  it("目標0の場合は0を返す", () => {
    expect(calculateAchievementRate(1000, 0)).toBe(0);
  });

  it("小数点1桁に丸める", () => {
    expect(calculateAchievementRate(333, 1000)).toBe(33.3);
  });
});

describe("emptyNutrition", () => {
  it("全て0の栄養素を返す", () => {
    expect(emptyNutrition()).toEqual({
      calories: 0,
      protein: 0,
      fat: 0,
      carbohydrate: 0,
    });
  });
});

// ========================================
// 日付ユーティリティテスト
// ========================================

describe("formatDateToString", () => {
  it("DateをYYYY-MM-DD形式に変換する", () => {
    const date = new Date(2026, 0, 21); // 2026-01-21
    expect(formatDateToString(date)).toBe("2026-01-21");
  });

  it("月と日を0埋めする", () => {
    const date = new Date(2026, 0, 5); // 2026-01-05
    expect(formatDateToString(date)).toBe("2026-01-05");
  });
});

describe("parseStringToDate", () => {
  it("YYYY-MM-DD形式をDateに変換する", () => {
    const result = parseStringToDate("2026-01-21");
    expect(result.getFullYear()).toBe(2026);
    expect(result.getMonth()).toBe(0); // 0-indexed
    expect(result.getDate()).toBe(21);
  });
});
