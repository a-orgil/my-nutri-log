"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Nutrition } from "@/lib/meals";

interface DailySummaryData {
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

interface DaySummaryCardProps {
  summary: DailySummaryData | null;
  isLoading?: boolean;
}

export function DaySummaryCard({ summary, isLoading }: DaySummaryCardProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">本日のサマリー</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="bg-muted h-4 w-3/4 rounded"></div>
            <div className="bg-muted h-8 rounded"></div>
            <div className="bg-muted h-4 w-1/2 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!summary) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">本日のサマリー</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">データを取得中...</p>
        </CardContent>
      </Card>
    );
  }

  const formatDate = (dateStr: string): string => {
    const [year, month, day] = dateStr.split("-");
    const date = new Date(Number(year), Number(month) - 1, Number(day));
    const weekDays = ["日", "月", "火", "水", "木", "金", "土"];
    return `${Number(month)}/${Number(day)}（${weekDays[date.getDay()]}）`;
  };

  const getProgressColor = (achievement: number): string => {
    if (achievement < 80) return "bg-yellow-500";
    if (achievement > 110) return "bg-red-500";
    return "bg-green-500";
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">
          {formatDate(summary.date)} のサマリー
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* カロリー */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>カロリー</span>
            <span className="font-medium">
              {Math.round(summary.totals.calories)} / {summary.targets.calories}{" "}
              kcal
            </span>
          </div>
          <div className="relative">
            <Progress
              value={Math.min(summary.achievement.calories, 100)}
              className="h-3"
            />
            <div
              className={`absolute inset-0 h-3 rounded-full ${getProgressColor(summary.achievement.calories)}`}
              style={{
                width: `${Math.min(summary.achievement.calories, 100)}%`,
                opacity: 0.8,
              }}
            />
          </div>
          <p className="text-muted-foreground text-right text-xs">
            {summary.achievement.calories}%
          </p>
        </div>

        {/* PFC */}
        <div className="grid grid-cols-3 gap-4">
          <PFCItem
            label="P"
            name="タンパク質"
            actual={summary.totals.protein}
            target={summary.targets.protein}
            achievement={summary.achievement.protein}
          />
          <PFCItem
            label="F"
            name="脂質"
            actual={summary.totals.fat}
            target={summary.targets.fat}
            achievement={summary.achievement.fat}
          />
          <PFCItem
            label="C"
            name="炭水化物"
            actual={summary.totals.carbohydrate}
            target={summary.targets.carbohydrate}
            achievement={summary.achievement.carbohydrate}
          />
        </div>

        {/* 食事タイプ別 */}
        <div className="border-t pt-2">
          <p className="text-muted-foreground mb-2 text-xs">食事別内訳</p>
          <div className="grid grid-cols-4 gap-2 text-xs">
            <MealTypeItem
              label="朝食"
              calories={summary.by_meal_type.breakfast.calories}
            />
            <MealTypeItem
              label="昼食"
              calories={summary.by_meal_type.lunch.calories}
            />
            <MealTypeItem
              label="夕食"
              calories={summary.by_meal_type.dinner.calories}
            />
            <MealTypeItem
              label="間食"
              calories={summary.by_meal_type.snack.calories}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function PFCItem({
  label,
  name,
  actual,
  target,
  achievement,
}: {
  label: string;
  name: string;
  actual: number;
  target: number;
  achievement: number;
}) {
  const getColor = (achievement: number): string => {
    if (achievement < 80) return "text-yellow-600";
    if (achievement > 110) return "text-red-600";
    return "text-green-600";
  };

  return (
    <div className="text-center">
      <div className="text-muted-foreground text-xs">{name}</div>
      <div className={`font-medium ${getColor(achievement)}`}>
        <span className="text-lg">{label}</span>
      </div>
      <div className="text-xs">
        {Math.round(actual)}g / {target}g
      </div>
      <div className={`text-xs ${getColor(achievement)}`}>{achievement}%</div>
    </div>
  );
}

function MealTypeItem({
  label,
  calories,
}: {
  label: string;
  calories: number;
}) {
  return (
    <div className="text-center">
      <div className="text-muted-foreground">{label}</div>
      <div className="font-medium">{Math.round(calories)}</div>
    </div>
  );
}
