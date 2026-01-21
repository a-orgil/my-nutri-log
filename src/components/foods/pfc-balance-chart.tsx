"use client";

import { Progress } from "@/components/ui/progress";
import { calculatePFCPercentage } from "@/lib/foods";

interface PFCBalanceChartProps {
  protein: number;
  fat: number;
  carbohydrate: number;
  showPercentage?: boolean;
  size?: "sm" | "md" | "lg";
}

export function PFCBalanceChart({
  protein,
  fat,
  carbohydrate,
  showPercentage = true,
  size = "md",
}: PFCBalanceChartProps) {
  const percentages = calculatePFCPercentage(protein, fat, carbohydrate);

  const sizeClasses = {
    sm: "h-1.5",
    md: "h-2",
    lg: "h-3",
  };

  const textSizeClasses = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  };

  return (
    <div className="space-y-2">
      {/* タンパク質 */}
      <div className="flex items-center gap-2">
        <span
          className={`w-4 font-medium text-blue-600 ${textSizeClasses[size]}`}
        >
          P
        </span>
        <div className="flex-1">
          <Progress
            value={percentages.protein}
            className={`${sizeClasses[size]} bg-blue-100`}
            style={
              {
                "--tw-progress-bg": "rgb(37 99 235)",
              } as React.CSSProperties
            }
          />
        </div>
        {showPercentage && (
          <span className={`w-10 text-right ${textSizeClasses[size]}`}>
            {percentages.protein}%
          </span>
        )}
      </div>

      {/* 脂質 */}
      <div className="flex items-center gap-2">
        <span
          className={`w-4 font-medium text-yellow-600 ${textSizeClasses[size]}`}
        >
          F
        </span>
        <div className="flex-1">
          <Progress
            value={percentages.fat}
            className={`${sizeClasses[size]} bg-yellow-100 [&>[data-slot=progress-indicator]]:bg-yellow-500`}
          />
        </div>
        {showPercentage && (
          <span className={`w-10 text-right ${textSizeClasses[size]}`}>
            {percentages.fat}%
          </span>
        )}
      </div>

      {/* 炭水化物 */}
      <div className="flex items-center gap-2">
        <span
          className={`w-4 font-medium text-green-600 ${textSizeClasses[size]}`}
        >
          C
        </span>
        <div className="flex-1">
          <Progress
            value={percentages.carbohydrate}
            className={`${sizeClasses[size]} bg-green-100 [&>[data-slot=progress-indicator]]:bg-green-500`}
          />
        </div>
        {showPercentage && (
          <span className={`w-10 text-right ${textSizeClasses[size]}`}>
            {percentages.carbohydrate}%
          </span>
        )}
      </div>
    </div>
  );
}
