"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, Plus, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface Food {
  id: number;
  name: string;
  calories: number;
  protein: number;
  fat: number;
  carbohydrate: number;
  servingSize: number;
  servingUnit: string;
}

interface FoodSelectorProps {
  onSelect: (food: Food) => void;
  excludeIds?: number[];
}

export function FoodSelector({ onSelect, excludeIds = [] }: FoodSelectorProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [foods, setFoods] = useState<Food[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const fetchFoods = useCallback(async (query: string) => {
    setIsLoading(true);
    try {
      const url = query
        ? `/api/v1/foods?q=${encodeURIComponent(query)}&limit=20`
        : `/api/v1/foods?limit=10`;
      const response = await fetch(url);
      const result = await response.json();

      if (result.success) {
        // snake_case to camelCase conversion
        const formattedFoods = result.data.foods.map(
          (f: {
            id: number;
            name: string;
            calories: number;
            protein: number;
            fat: number;
            carbohydrate: number;
            serving_size: number;
            serving_unit: string;
          }) => ({
            id: f.id,
            name: f.name,
            calories: f.calories,
            protein: f.protein,
            fat: f.fat,
            carbohydrate: f.carbohydrate,
            servingSize: f.serving_size,
            servingUnit: f.serving_unit,
          })
        );
        setFoods(formattedFoods);
      }
    } catch (error) {
      console.error("Failed to fetch foods:", error);
    } finally {
      setIsLoading(false);
      setIsInitialLoad(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchFoods(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, fetchFoods]);

  const filteredFoods = foods.filter((food) => !excludeIds.includes(food.id));

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform" />
        <Input
          type="text"
          placeholder="食品名で検索..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
        {isLoading && (
          <Loader2 className="text-muted-foreground absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 transform animate-spin" />
        )}
      </div>

      <div className="max-h-60 space-y-2 overflow-y-auto">
        {isInitialLoad ? (
          <>
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="p-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <Skeleton className="h-8 w-8 rounded" />
                </div>
              </Card>
            ))}
          </>
        ) : filteredFoods.length > 0 ? (
          filteredFoods.map((food) => (
            <Card key={food.id} className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{food.name}</p>
                  <p className="text-muted-foreground text-xs">
                    {Math.round(food.calories)} kcal / {food.servingSize}
                    {food.servingUnit}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => onSelect(food)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))
        ) : (
          <div className="text-muted-foreground py-6 text-center text-sm">
            {searchQuery
              ? "該当する食品が見つかりません"
              : "食品を検索してください"}
          </div>
        )}
      </div>
    </div>
  );
}
