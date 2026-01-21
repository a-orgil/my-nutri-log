"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MealForm } from "@/components/meals";
import { MealType, mealTypes } from "@/lib/meals";

export default function NewMealPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const dateParam =
    searchParams.get("date") || new Date().toISOString().split("T")[0];
  const typeParam = searchParams.get("type") as MealType | null;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (data: {
    recordDate: string;
    mealType: MealType;
    memo?: string;
    items: Array<{ foodId: number; quantity: number }>;
  }) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/v1/meals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          record_date: data.recordDate,
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
        throw new Error(result.error?.message || "登録に失敗しました");
      }

      router.push(`/meals?date=${data.recordDate}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-4 pb-20">
      <div className="mb-4 flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-semibold">食事を記録</h1>
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
          <CardTitle className="text-base">新規登録</CardTitle>
        </CardHeader>
        <CardContent>
          <MealForm
            defaultValues={{
              recordDate: dateParam,
              mealType:
                typeParam && mealTypes.includes(typeParam)
                  ? typeParam
                  : undefined,
            }}
            onSubmit={handleSubmit}
            isLoading={isSubmitting}
            mode="create"
          />
        </CardContent>
      </Card>
    </div>
  );
}
