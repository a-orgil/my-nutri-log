"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { FoodCard } from "./food-card";
import type { Food } from "@/lib/foods";

interface FoodListProps {
  foods: Food[];
  isLoading?: boolean;
  onEdit?: (id: number) => void;
  onDelete?: (id: number) => void;
  emptyMessage?: string;
  groupByUser?: boolean;
}

export function FoodList({
  foods,
  isLoading = false,
  onEdit,
  onDelete,
  emptyMessage = "食品が登録されていません",
  groupByUser = true,
}: FoodListProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  if (foods.length === 0) {
    return (
      <div className="text-muted-foreground py-8 text-center">
        {emptyMessage}
      </div>
    );
  }

  if (groupByUser) {
    const myFoods = foods.filter((food) => food.user_id !== null);
    const defaultFoods = foods.filter((food) => food.user_id === null);

    return (
      <div className="space-y-6">
        {myFoods.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-muted-foreground text-sm font-medium">
              マイ食品
            </h2>
            {myFoods.map((food) => (
              <FoodCard
                key={food.id}
                food={food}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
          </div>
        )}

        {defaultFoods.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-muted-foreground text-sm font-medium">
              デフォルト食品
            </h2>
            {defaultFoods.map((food) => (
              <FoodCard
                key={food.id}
                food={food}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {foods.map((food) => (
        <FoodCard
          key={food.id}
          food={food}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
