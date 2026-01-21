"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight, Plus, Loader2 } from "lucide-react";

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
} from "@/components/ui/alert-dialog";

import { MealSection, NutritionSummary } from "@/components/meals";
import {
  MealResponse,
  MealType,
  mealTypes,
  sumNutrition,
  Nutrition,
  formatDateToString,
} from "@/lib/meals";

interface DailySummary {
  date: string;
  totals: Nutrition;
  targets: Nutrition;
}

export default function MealsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // 日付を取得（クエリパラメータまたは今日）
  const dateParam = searchParams.get("date");
  const [selectedDate, setSelectedDate] = useState(
    dateParam || formatDateToString(new Date())
  );

  const [meals, setMeals] = useState<MealResponse[]>([]);
  const [summary, setSummary] = useState<DailySummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mealToDelete, setMealToDelete] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // データ取得
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // 食事記録と日次サマリーを並列取得
      const [mealsRes, summaryRes] = await Promise.all([
        fetch(`/api/v1/meals?date=${selectedDate}`),
        fetch(`/api/v1/summary/daily?date=${selectedDate}`),
      ]);

      const mealsData = await mealsRes.json();
      const summaryData = await summaryRes.json();

      if (!mealsRes.ok) {
        throw new Error(
          mealsData.error?.message || "食事記録の取得に失敗しました"
        );
      }

      if (!summaryRes.ok) {
        throw new Error(
          summaryData.error?.message || "サマリーの取得に失敗しました"
        );
      }

      // snake_case → camelCase 変換
      const formattedMeals: MealResponse[] = mealsData.data.meals.map(
        (meal: {
          id: number;
          record_date: string;
          meal_type: MealType;
          memo: string | null;
          items: Array<{
            id: number;
            food: { id: number; name: string; serving_unit: string };
            quantity: number;
            calories: number;
            protein: number;
            fat: number;
            carbohydrate: number;
          }>;
          totals: Nutrition;
          created_at: string;
          updated_at: string;
        }) => ({
          id: meal.id,
          recordDate: meal.record_date,
          mealType: meal.meal_type,
          memo: meal.memo,
          items: meal.items.map((item) => ({
            id: item.id,
            food: {
              id: item.food.id,
              name: item.food.name,
              servingUnit: item.food.serving_unit,
            },
            quantity: item.quantity,
            calories: item.calories,
            protein: item.protein,
            fat: item.fat,
            carbohydrate: item.carbohydrate,
          })),
          totals: meal.totals,
          createdAt: meal.created_at,
          updatedAt: meal.updated_at,
        })
      );

      setMeals(formattedMeals);
      setSummary({
        date: summaryData.data.date,
        totals: summaryData.data.totals,
        targets: summaryData.data.targets,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました");
    } finally {
      setIsLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // 日付変更
  const handleDateChange = (offset: number) => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() + offset);
    const newDate = formatDateToString(date);
    setSelectedDate(newDate);
    router.push(`/meals?date=${newDate}`);
  };

  // 食事タイプ別にグループ化
  const mealsByType = mealTypes.reduce(
    (acc, type) => {
      acc[type] = meals.filter((m) => m.mealType === type);
      return acc;
    },
    {} as Record<MealType, MealResponse[]>
  );

  // 日次合計を計算
  const dailyTotals = sumNutrition(meals.map((m) => m.totals));

  // 削除処理
  const handleDelete = async () => {
    if (!mealToDelete) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/v1/meals/${mealToDelete}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error?.message || "削除に失敗しました");
      }

      setMealToDelete(null);
      fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "削除に失敗しました");
    } finally {
      setIsDeleting(false);
    }
  };

  // 日付をフォーマット
  const formatDisplayDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const days = ["日", "月", "火", "水", "木", "金", "土"];
    return `${date.getMonth() + 1}月${date.getDate()}日（${days[date.getDay()]}）`;
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive text-center">{error}</p>
            <Button
              variant="outline"
              className="mt-4 w-full"
              onClick={fetchData}
            >
              再読み込み
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4 pb-20">
      {/* 日付ナビゲーション */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => handleDateChange(-1)}
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-semibold">
          {formatDisplayDate(selectedDate)}
        </h1>
        <Button variant="ghost" size="icon" onClick={() => handleDateChange(1)}>
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>

      {/* 日次サマリー */}
      {summary && (
        <NutritionSummary
          totals={dailyTotals}
          targets={summary.targets}
          title="本日の摂取量"
        />
      )}

      {/* 食事タイプ別セクション */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">食事記録</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {mealTypes.map((type) => (
            <MealSection
              key={type}
              mealType={type}
              meals={mealsByType[type]}
              onAddClick={() =>
                router.push(`/meals/new?date=${selectedDate}&type=${type}`)
              }
              onMealClick={(mealId) => router.push(`/meals/${mealId}/edit`)}
            />
          ))}
        </CardContent>
      </Card>

      {/* 追加ボタン（フローティング） */}
      <Button
        className="fixed right-4 bottom-20 h-14 w-14 rounded-full shadow-lg"
        onClick={() => router.push(`/meals/new?date=${selectedDate}`)}
      >
        <Plus className="h-6 w-6" />
      </Button>

      {/* 削除確認ダイアログ */}
      <AlertDialog
        open={mealToDelete !== null}
        onOpenChange={() => setMealToDelete(null)}
      >
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
  );
}
