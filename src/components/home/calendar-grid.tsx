"use client";

import { cn } from "@/lib/utils";

interface DaySummary {
  date: string;
  calories: number;
  has_records: boolean;
}

interface CalendarGridProps {
  year: number;
  month: number;
  dailySummaries: DaySummary[];
  selectedDate: string;
  targetCalories: number;
  onDateSelect: (date: string) => void;
  onDateDoubleClick: (date: string) => void;
}

const weekDays = ["日", "月", "火", "水", "木", "金", "土"];

export function CalendarGrid({
  year,
  month,
  dailySummaries,
  selectedDate,
  targetCalories,
  onDateSelect,
  onDateDoubleClick,
}: CalendarGridProps) {
  // 月の初日と最終日を取得
  const firstDay = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0);
  const daysInMonth = lastDay.getDate();
  const startDayOfWeek = firstDay.getDay();

  // 日別のサマリーをマップに変換
  const summaryMap = new Map(dailySummaries.map((s) => [s.date, s]));

  // カレンダーの日付配列を生成
  const calendarDays: (number | null)[] = [];

  // 先頭の空白
  for (let i = 0; i < startDayOfWeek; i++) {
    calendarDays.push(null);
  }

  // 日付
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }

  // 末尾の空白（7の倍数になるまで）
  while (calendarDays.length % 7 !== 0) {
    calendarDays.push(null);
  }

  const getDateString = (day: number): string => {
    return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  };

  const getCalorieColor = (calories: number): string => {
    if (calories === 0) return "";
    const ratio = calories / targetCalories;
    if (ratio < 0.8) return "text-yellow-600";
    if (ratio > 1.1) return "text-red-600";
    return "text-green-600";
  };

  const today = new Date();
  const todayString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  return (
    <div className="w-full">
      {/* 曜日ヘッダー */}
      <div className="mb-1 grid grid-cols-7 gap-1">
        {weekDays.map((day, index) => (
          <div
            key={day}
            className={cn(
              "py-1 text-center text-xs font-medium",
              index === 0 && "text-red-500",
              index === 6 && "text-blue-500"
            )}
          >
            {day}
          </div>
        ))}
      </div>

      {/* カレンダーグリッド */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((day, index) => {
          if (day === null) {
            return <div key={`empty-${index}`} className="aspect-square" />;
          }

          const dateStr = getDateString(day);
          const summary = summaryMap.get(dateStr);
          const isSelected = dateStr === selectedDate;
          const isToday = dateStr === todayString;
          const dayOfWeek = index % 7;

          return (
            <button
              key={dateStr}
              onClick={() => onDateSelect(dateStr)}
              onDoubleClick={() => onDateDoubleClick(dateStr)}
              className={cn(
                "flex aspect-square flex-col items-center justify-center rounded-lg p-1 transition-colors",
                "hover:bg-muted/50",
                isSelected &&
                  "bg-primary text-primary-foreground hover:bg-primary/90",
                isToday && !isSelected && "ring-primary ring-2",
                dayOfWeek === 0 && !isSelected && "text-red-500",
                dayOfWeek === 6 && !isSelected && "text-blue-500"
              )}
            >
              <span className="text-sm font-medium">{day}</span>
              {summary?.has_records && (
                <span
                  className={cn(
                    "text-[10px] leading-tight",
                    isSelected
                      ? "text-primary-foreground/80"
                      : getCalorieColor(summary.calories)
                  )}
                >
                  {Math.round(summary.calories)}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
