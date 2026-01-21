"use client";

import { Minus, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface MealItemCardProps {
  id?: number;
  foodName: string;
  servingUnit: string;
  quantity: number;
  calories: number;
  protein: number;
  fat: number;
  carbohydrate: number;
  onQuantityChange?: (quantity: number) => void;
  onRemove?: () => void;
  readonly?: boolean;
}

export function MealItemCard({
  foodName,
  servingUnit,
  quantity,
  calories,
  protein,
  fat,
  carbohydrate,
  onQuantityChange,
  onRemove,
  readonly = false,
}: MealItemCardProps) {
  const handleDecrease = () => {
    if (quantity > 0.1) {
      const newQuantity = Math.round((quantity - 0.5) * 10) / 10;
      onQuantityChange?.(Math.max(0.1, newQuantity));
    }
  };

  const handleIncrease = () => {
    const newQuantity = Math.round((quantity + 0.5) * 10) / 10;
    onQuantityChange?.(newQuantity);
  };

  return (
    <Card className="p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{foodName}</p>
          <div className="mt-1 flex items-center gap-2">
            {!readonly && onQuantityChange ? (
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-6 w-6"
                  onClick={handleDecrease}
                  disabled={quantity <= 0.1}
                >
                  <Minus className="h-3 w-3" />
                </Button>
                <span className="w-12 text-center text-sm">
                  {quantity.toFixed(1)}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-6 w-6"
                  onClick={handleIncrease}
                >
                  <Plus className="h-3 w-3" />
                </Button>
                <span className="text-muted-foreground text-xs">
                  {servingUnit}
                </span>
              </div>
            ) : (
              <span className="text-muted-foreground text-sm">
                {quantity.toFixed(1)} {servingUnit}
              </span>
            )}
          </div>
          <p className="text-muted-foreground mt-1 text-xs">
            P: {protein.toFixed(1)}g / F: {fat.toFixed(1)}g / C:{" "}
            {carbohydrate.toFixed(1)}g
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium whitespace-nowrap">
            {Math.round(calories)} kcal
          </span>
          {!readonly && onRemove && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-destructive h-6 w-6"
              onClick={onRemove}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
