"use client";

import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { FoodSelector } from "./food-selector";
import { MealItemCard } from "./meal-item-card";
import { NutritionSummary } from "./nutrition-summary";
import {
  mealTypes,
  mealTypeLabels,
  MealType,
  calculateNutrition,
  sumNutrition,
} from "@/lib/meals";

// フォーム用のスキーマ（フロントエンド用）
const formSchema = z.object({
  recordDate: z.string().min(1, "日付を選択してください"),
  mealType: z.enum(mealTypes, { error: "食事タイプを選択してください" }),
  memo: z.string().max(500, "メモは500文字以内で入力してください").optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface SelectedFood {
  id: number;
  name: string;
  calories: number;
  protein: number;
  fat: number;
  carbohydrate: number;
  servingSize: number;
  servingUnit: string;
  quantity: number;
}

interface MealFormProps {
  defaultValues?: {
    recordDate?: string;
    mealType?: MealType;
    memo?: string;
    items?: Array<{
      foodId: number;
      foodName: string;
      calories: number;
      protein: number;
      fat: number;
      carbohydrate: number;
      servingSize: number;
      servingUnit: string;
      quantity: number;
    }>;
  };
  onSubmit: (data: {
    recordDate: string;
    mealType: MealType;
    memo?: string;
    items: Array<{ foodId: number; quantity: number }>;
  }) => Promise<void>;
  isLoading?: boolean;
  mode: "create" | "edit";
}

export function MealForm({
  defaultValues,
  onSubmit,
  isLoading = false,
  mode,
}: MealFormProps) {
  const [selectedFoods, setSelectedFoods] = useState<SelectedFood[]>(() => {
    if (defaultValues?.items) {
      return defaultValues.items.map((item) => ({
        id: item.foodId,
        name: item.foodName,
        calories: item.calories,
        protein: item.protein,
        fat: item.fat,
        carbohydrate: item.carbohydrate,
        servingSize: item.servingSize,
        servingUnit: item.servingUnit,
        quantity: item.quantity,
      }));
    }
    return [];
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      recordDate:
        defaultValues?.recordDate || new Date().toISOString().split("T")[0],
      mealType: defaultValues?.mealType || undefined,
      memo: defaultValues?.memo || "",
    },
  });

  const selectedMealType = watch("mealType");

  const handleFoodSelect = (food: {
    id: number;
    name: string;
    calories: number;
    protein: number;
    fat: number;
    carbohydrate: number;
    servingSize: number;
    servingUnit: string;
  }) => {
    setSelectedFoods((prev) => [...prev, { ...food, quantity: 1 }]);
  };

  const handleQuantityChange = (index: number, quantity: number) => {
    setSelectedFoods((prev) =>
      prev.map((food, i) => (i === index ? { ...food, quantity } : food))
    );
  };

  const handleRemoveFood = (index: number) => {
    setSelectedFoods((prev) => prev.filter((_, i) => i !== index));
  };

  // 選択済み食品の栄養素を計算
  const calculatedItems = useMemo(() => {
    return selectedFoods.map((food) => {
      const nutrition = calculateNutrition(food, food.quantity);
      return {
        ...food,
        calculatedCalories: nutrition.calories,
        calculatedProtein: nutrition.protein,
        calculatedFat: nutrition.fat,
        calculatedCarbohydrate: nutrition.carbohydrate,
      };
    });
  }, [selectedFoods]);

  // 合計栄養素
  const totals = useMemo(() => {
    return sumNutrition(
      calculatedItems.map((item) => ({
        calories: item.calculatedCalories,
        protein: item.calculatedProtein,
        fat: item.calculatedFat,
        carbohydrate: item.calculatedCarbohydrate,
      }))
    );
  }, [calculatedItems]);

  const handleFormSubmit = async (data: FormValues) => {
    if (selectedFoods.length === 0) {
      return;
    }

    await onSubmit({
      recordDate: data.recordDate,
      mealType: data.mealType,
      memo: data.memo || undefined,
      items: selectedFoods.map((food) => ({
        foodId: food.id,
        quantity: food.quantity,
      })),
    });
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {/* 日付 */}
      <div className="space-y-2">
        <Label htmlFor="recordDate">日付</Label>
        <Input
          id="recordDate"
          type="date"
          {...register("recordDate")}
          disabled={mode === "edit"}
        />
        {errors.recordDate && (
          <p className="text-destructive text-sm">
            {errors.recordDate.message}
          </p>
        )}
      </div>

      {/* 食事タイプ */}
      <div className="space-y-2">
        <Label>食事タイプ</Label>
        <Select
          value={selectedMealType}
          onValueChange={(value) => setValue("mealType", value as MealType)}
        >
          <SelectTrigger>
            <SelectValue placeholder="選択してください" />
          </SelectTrigger>
          <SelectContent>
            {mealTypes.map((type) => (
              <SelectItem key={type} value={type}>
                {mealTypeLabels[type]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.mealType && (
          <p className="text-destructive text-sm">{errors.mealType.message}</p>
        )}
      </div>

      {/* 食品選択 */}
      <div className="space-y-2">
        <Label>食品を追加</Label>
        <FoodSelector
          onSelect={handleFoodSelect}
          excludeIds={selectedFoods.map((f) => f.id)}
        />
      </div>

      {/* 選択済み食品 */}
      {selectedFoods.length > 0 && (
        <div className="space-y-2">
          <Label>追加済みの食品</Label>
          <div className="space-y-2">
            {calculatedItems.map((item, index) => (
              <MealItemCard
                key={`${item.id}-${index}`}
                foodName={item.name}
                servingUnit={item.servingUnit}
                quantity={item.quantity}
                calories={item.calculatedCalories}
                protein={item.calculatedProtein}
                fat={item.calculatedFat}
                carbohydrate={item.calculatedCarbohydrate}
                onQuantityChange={(q) => handleQuantityChange(index, q)}
                onRemove={() => handleRemoveFood(index)}
              />
            ))}
          </div>
        </div>
      )}

      {/* メモ */}
      <div className="space-y-2">
        <Label htmlFor="memo">メモ（任意）</Label>
        <Textarea
          id="memo"
          {...register("memo")}
          placeholder="メモを入力..."
          rows={2}
        />
        {errors.memo && (
          <p className="text-destructive text-sm">{errors.memo.message}</p>
        )}
      </div>

      {/* 合計 */}
      {selectedFoods.length > 0 && (
        <NutritionSummary totals={totals} title="合計" />
      )}

      {/* 送信ボタン */}
      <Button
        type="submit"
        className="w-full"
        disabled={isLoading || selectedFoods.length === 0}
      >
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {mode === "create" ? "登録する" : "更新する"}
      </Button>

      {selectedFoods.length === 0 && (
        <p className="text-muted-foreground text-center text-sm">
          食品を1つ以上追加してください
        </p>
      )}
    </form>
  );
}
