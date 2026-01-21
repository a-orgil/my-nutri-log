"use client";

import { use, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { MealForm } from "@/components/meals";
import { MealType } from "@/lib/meals";

interface MealDetail {
  id: number;
  recordDate: string;
  mealType: MealType;
  memo: string | null;
  items: Array<{
    id: number;
    food: {
      id: number;
      name: string;
      calories: number;
      protein: number;
      fat: number;
      carbohydrate: number;
      servingSize: number;
      servingUnit: string;
    };
    quantity: number;
    calories: number;
    protein: number;
    fat: number;
    carbohydrate: number;
  }>;
}

export default function EditMealPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const [meal, setMeal] = useState<MealDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // データ取得
  const fetchMeal = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/v1/meals/${id}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error?.message || "データの取得に失敗しました");
      }

      // snake_case → camelCase 変換
      const data = result.data;
      setMeal({
        id: data.id,
        recordDate: data.record_date,
        mealType: data.meal_type,
        memo: data.memo,
        items: data.items.map(
          (item: {
            id: number;
            food: {
              id: number;
              name: string;
              calories: number;
              protein: number;
              fat: number;
              carbohydrate: number;
              serving_size: number;
              serving_unit: string;
            };
            quantity: number;
            calories: number;
            protein: number;
            fat: number;
            carbohydrate: number;
          }) => ({
            id: item.id,
            food: {
              id: item.food.id,
              name: item.food.name,
              calories: item.food.calories,
              protein: item.food.protein,
              fat: item.food.fat,
              carbohydrate: item.food.carbohydrate,
              servingSize: item.food.serving_size,
              servingUnit: item.food.serving_unit,
            },
            quantity: item.quantity,
            calories: item.calories,
            protein: item.protein,
            fat: item.fat,
            carbohydrate: item.carbohydrate,
          })
        ),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました");
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchMeal();
  }, [fetchMeal]);

  // 更新処理
  const handleSubmit = async (data: {
    recordDate: string;
    mealType: MealType;
    memo?: string;
    items: Array<{ foodId: number; quantity: number }>;
  }) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/v1/meals/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          meal_type: data.mealType,
          memo: data.memo,
          items: data.items.map((item) => ({
            food_id: item.foodId,
            quantity: item.quantity,
          })),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error?.message || "更新に失敗しました");
      }

      router.push(`/meals?date=${data.recordDate}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました");
    } finally {
      setIsSubmitting(false);
    }
  };

  // 削除処理
  const handleDelete = async () => {
    setIsDeleting(true);
    setError(null);

    try {
      const response = await fetch(`/api/v1/meals/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error?.message || "削除に失敗しました");
      }

      router.push(`/meals?date=${meal?.recordDate || ""}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました");
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-4">
        <div className="mb-4 flex items-center gap-2">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-6 w-32" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-24" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-20 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error && !meal) {
    return (
      <div className="p-4">
        <div className="mb-4 flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold">食事記録の編集</h1>
        </div>
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive text-center">{error}</p>
            <Button
              variant="outline"
              className="mt-4 w-full"
              onClick={fetchMeal}
            >
              再読み込み
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!meal) {
    return null;
  }

  return (
    <div className="p-4 pb-20">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold">食事記録の編集</h1>
        </div>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="icon" className="text-destructive">
              <Trash2 className="h-5 w-5" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>食事記録を削除しますか？</AlertDialogTitle>
              <AlertDialogDescription>
                この操作は取り消せません。
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>
                キャンセル
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                disabled={isDeleting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isDeleting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "削除"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {error && (
        <Card className="border-destructive mb-4">
          <CardContent className="pt-4">
            <p className="text-destructive text-sm">{error}</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">編集</CardTitle>
        </CardHeader>
        <CardContent>
          <MealForm
            defaultValues={{
              recordDate: meal.recordDate,
              mealType: meal.mealType,
              memo: meal.memo || "",
              items: meal.items.map((item) => ({
                foodId: item.food.id,
                foodName: item.food.name,
                calories: item.food.calories,
                protein: item.food.protein,
                fat: item.food.fat,
                carbohydrate: item.food.carbohydrate,
                servingSize: item.food.servingSize,
                servingUnit: item.food.servingUnit,
                quantity: item.quantity,
              })),
            }}
            onSubmit={handleSubmit}
            isLoading={isSubmitting}
            mode="edit"
          />
        </CardContent>
      </Card>
    </div>
  );
}
