"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MealItemCard } from "./meal-item-card";
import { mealTypeLabels, MealType, MealResponse } from "@/lib/meals";

interface MealSectionProps {
  mealType: MealType;
  meals: MealResponse[];
  onAddClick?: () => void;
  onMealClick?: (mealId: number) => void;
  onDeleteItem?: (mealId: number) => void;
}

export function MealSection({
  mealType,
  meals,
  onAddClick,
  onMealClick,
}: MealSectionProps) {
  const label = mealTypeLabels[mealType];
  const totalCalories = meals.reduce(
    (sum, meal) => sum + meal.totals.calories,
    0
  );

  const allItems = meals.flatMap((meal) =>
    meal.items.map((item) => ({
      ...item,
      mealId: meal.id,
    }))
  );

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold">{label}</h3>
          <span className="text-muted-foreground text-sm">
            {Math.round(totalCalories)} kcal
          </span>
        </div>
        {onAddClick && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onAddClick}
            className="h-7 text-xs"
          >
            <Plus className="mr-1 h-3 w-3" />
            追加
          </Button>
        )}
      </div>

      {allItems.length > 0 ? (
        <div className="space-y-2">
          {allItems.map((item, index) => (
            <div
              key={`${item.mealId}-${item.id}-${index}`}
              className={onMealClick ? "cursor-pointer" : ""}
              onClick={() => onMealClick?.(item.mealId)}
            >
              <MealItemCard
                id={item.id}
                foodName={item.food.name}
                servingUnit={item.food.servingUnit}
                quantity={item.quantity}
                calories={item.calories}
                protein={item.protein}
                fat={item.fat}
                carbohydrate={item.carbohydrate}
                readonly
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="text-muted-foreground py-4 text-center text-sm">
          記録なし
        </div>
      )}
    </div>
  );
}
