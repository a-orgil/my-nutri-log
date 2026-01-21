"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarGrid, DaySummaryCard } from "@/components/home";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { Nutrition } from "@/lib/meals";

interface DailySummaryItem {
  date: string;
  calories: number;
  protein: number;
  fat: number;
  carbohydrate: number;
  has_records: boolean;
}

interface MonthlySummaryResponse {
  year: number;
  month: number;
  targets: Nutrition;
  daily_summaries: DailySummaryItem[];
  monthly_average: Nutrition;
}

interface DailySummaryResponse {
  date: string;
  totals: Nutrition;
  targets: Nutrition;
  achievement: {
    calories: number;
    protein: number;
    fat: number;
    carbohydrate: number;
  };
  by_meal_type: {
    breakfast: Nutrition;
    lunch: Nutrition;
    dinner: Nutrition;
    snack: Nutrition;
  };
}

export default function HomePage() {
  const router = useRouter();
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth() + 1);
  const [selectedDate, setSelectedDate] = useState(formatDate(today));
  const [monthlySummary, setMonthlySummary] =
    useState<MonthlySummaryResponse | null>(null);
  const [dailySummary, setDailySummary] = useState<DailySummaryResponse | null>(
    null
  );
  const [isLoadingMonthly, setIsLoadingMonthly] = useState(true);
  const [isLoadingDaily, setIsLoadingDaily] = useState(true);

  // 月次サマリーを取得
  const fetchMonthlySummary = useCallback(
    async (year: number, month: number) => {
      setIsLoadingMonthly(true);
      try {
        const res = await fetch(
          `/api/v1/summary/monthly?year=${year}&month=${month}`
        );
        const data = await res.json();
        if (data.success) {
          setMonthlySummary(data.data);
        }
      } catch (error) {
        console.error("Failed to fetch monthly summary:", error);
      } finally {
        setIsLoadingMonthly(false);
      }
    },
    []
  );

  // 日次サマリーを取得
  const fetchDailySummary = useCallback(async (date: string) => {
    setIsLoadingDaily(true);
    try {
      const res = await fetch(`/api/v1/summary/daily?date=${date}`);
      const data = await res.json();
      if (data.success) {
        setDailySummary(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch daily summary:", error);
    } finally {
      setIsLoadingDaily(false);
    }
  }, []);

  // 初回読み込み
  useEffect(() => {
    fetchMonthlySummary(currentYear, currentMonth);
  }, [currentYear, currentMonth, fetchMonthlySummary]);

  useEffect(() => {
    fetchDailySummary(selectedDate);
  }, [selectedDate, fetchDailySummary]);

  // 前月へ
  const goToPreviousMonth = () => {
    if (currentMonth === 1) {
      setCurrentYear((y) => y - 1);
      setCurrentMonth(12);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  // 次月へ
  const goToNextMonth = () => {
    if (currentMonth === 12) {
      setCurrentYear((y) => y + 1);
      setCurrentMonth(1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  // 日付選択
  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
  };

  // 日付ダブルクリック（食事記録一覧へ遷移）
  const handleDateDoubleClick = (date: string) => {
    router.push(`/meals?date=${date}`);
  };

  return (
    <div className="space-y-6 pb-4">
      {/* カレンダーヘッダー */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="icon" onClick={goToPreviousMonth}>
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <CardTitle className="text-lg">
              {currentYear}年{currentMonth}月
            </CardTitle>
            <Button variant="ghost" size="icon" onClick={goToNextMonth}>
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingMonthly ? (
            <div className="flex h-64 items-center justify-center">
              <div className="text-muted-foreground animate-pulse">
                読み込み中...
              </div>
            </div>
          ) : monthlySummary ? (
            <CalendarGrid
              year={currentYear}
              month={currentMonth}
              dailySummaries={monthlySummary.daily_summaries}
              selectedDate={selectedDate}
              targetCalories={monthlySummary.targets.calories}
              onDateSelect={handleDateSelect}
              onDateDoubleClick={handleDateDoubleClick}
            />
          ) : (
            <div className="flex h-64 items-center justify-center">
              <div className="text-muted-foreground">
                データの取得に失敗しました
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 日次サマリー */}
      <DaySummaryCard summary={dailySummary} isLoading={isLoadingDaily} />

      {/* 食事記録ボタン */}
      <div className="fixed right-4 bottom-20 z-40">
        <Button asChild size="lg" className="h-14 w-14 rounded-full shadow-lg">
          <Link href={`/meals/new?date=${selectedDate}`}>
            <Plus className="h-6 w-6" />
            <span className="sr-only">食事を記録する</span>
          </Link>
        </Button>
      </div>

      {/* 月平均（記録がある場合のみ表示） */}
      {monthlySummary && monthlySummary.monthly_average.calories > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">
              {currentMonth}月の平均（記録日のみ）
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-2 text-center text-sm">
              <div>
                <div className="text-muted-foreground text-xs">カロリー</div>
                <div className="font-medium">
                  {Math.round(monthlySummary.monthly_average.calories)} kcal
                </div>
              </div>
              <div>
                <div className="text-muted-foreground text-xs">P</div>
                <div className="font-medium">
                  {Math.round(monthlySummary.monthly_average.protein)}g
                </div>
              </div>
              <div>
                <div className="text-muted-foreground text-xs">F</div>
                <div className="font-medium">
                  {Math.round(monthlySummary.monthly_average.fat)}g
                </div>
              </div>
              <div>
                <div className="text-muted-foreground text-xs">C</div>
                <div className="font-medium">
                  {Math.round(monthlySummary.monthly_average.carbohydrate)}g
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
