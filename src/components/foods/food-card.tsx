"use client";

import { Pencil, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Food } from "@/lib/foods";

interface FoodCardProps {
  food: Food;
  onEdit?: (id: number) => void;
  onDelete?: (id: number) => void;
}

export function FoodCard({ food, onEdit, onDelete }: FoodCardProps) {
  const isEditable = !food.is_default && food.user_id !== null;

  return (
    <Card className="hover:bg-accent/50 transition-colors">
      <CardContent className="flex items-center justify-between p-4">
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-medium">{food.name}</h3>
          <p className="text-muted-foreground text-sm">
            {food.calories} kcal ({food.serving_size}
            {food.serving_unit})
          </p>
          <p className="text-muted-foreground mt-1 text-xs">
            P:{food.protein}g F:{food.fat}g C:{food.carbohydrate}g
          </p>
        </div>

        {isEditable && (
          <div className="ml-2 flex items-center gap-1">
            {onEdit && (
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => onEdit(food.id)}
                aria-label="編集"
              >
                <Pencil className="h-4 w-4" />
              </Button>
            )}
            {onDelete && (
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => onDelete(food.id)}
                aria-label="削除"
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
