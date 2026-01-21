"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { FoodForm } from "@/components/foods";
import type { Food, FoodFormInput } from "@/lib/foods";

interface EditFoodPageProps {
  params: Promise<{ id: string }>;
}

export default function EditFoodPage({ params }: EditFoodPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const [food, setFood] = useState<Food | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFood = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/v1/foods/${id}`);
        const result = await response.json();

        if (!response.ok) {
          if (response.status === 404) {
            setError("食品が見つかりません");
          } else if (response.status === 403) {
            setError("この食品を編集する権限がありません");
          } else {
            setError(result.error?.message || "データの取得に失敗しました");
          }
          return;
        }

        setFood(result.data);
      } catch {
        setError("データの取得中にエラーが発生しました");
      } finally {
        setIsLoading(false);
      }
    };

    fetchFood();
  }, [id]);

  const handleSubmit = async (data: FoodFormInput) => {
    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/v1/foods/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error?.message || "更新に失敗しました");
        return;
      }

      router.push("/foods");
    } catch {
      setError("更新中にエラーが発生しました");
    } finally {
      setIsSaving(false);
    }
  };

  const defaultValues: Partial<FoodFormInput> | undefined = food
    ? {
        name: food.name,
        calories: food.calories,
        protein: food.protein,
        fat: food.fat,
        carbohydrate: food.carbohydrate,
        servingSize: food.serving_size,
        servingUnit: food.serving_unit as FoodFormInput["servingUnit"],
      }
    : undefined;

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/foods">
            <ArrowLeft className="h-5 w-5" />
            <span className="sr-only">戻る</span>
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">食品を編集</h1>
      </div>

      {/* エラー表示 */}
      {error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* フォーム */}
      <div className="mx-auto max-w-md">
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : food ? (
          <FoodForm
            defaultValues={defaultValues}
            onSubmit={handleSubmit}
            isLoading={isSaving}
            mode="edit"
          />
        ) : (
          <div className="text-muted-foreground py-8 text-center">
            食品データを読み込めませんでした
          </div>
        )}
      </div>
    </div>
  );
}
