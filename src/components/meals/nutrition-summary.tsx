"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Nutrition } from "@/lib/meals";

interface NutritionSummaryProps {
  totals: Nutrition;
  targets?: Nutrition;
  title?: string;
  compact?: boolean;
}

export function NutritionSummary({
  totals,
  targets,
  title,
  compact = false,
}: NutritionSummaryProps) {
  const calorieProgress = targets
    ? Math.min(100, (totals.calories / targets.calories) * 100)
    : 0;

  if (compact) {
    return (
      <div className="text-sm">
        <div className="mb-1 flex items-center justify-between">
          <span className="text-muted-foreground">カロリー</span>
          <span className="font-medium">
            {Math.round(totals.calories)}
            {targets && (
              <span className="text-muted-foreground">
                {" "}
                / {targets.calories} kcal
              </span>
            )}
          </span>
        </div>
        {targets && <Progress value={calorieProgress} className="mb-2 h-2" />}
        <div className="text-muted-foreground flex justify-between text-xs">
          <span>P: {totals.protein.toFixed(1)}g</span>
          <span>F: {totals.fat.toFixed(1)}g</span>
          <span>C: {totals.carbohydrate.toFixed(1)}g</span>
        </div>
      </div>
    );
  }

  return (
    <Card>
      {title && (
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{title}</CardTitle>
        </CardHeader>
      )}
      <CardContent className={title ? "" : "pt-4"}>
        <div className="space-y-4">
          {/* カロリー */}
          <div>
            <div className="mb-1 flex items-center justify-between">
              <span className="text-sm font-medium">カロリー</span>
              <span className="text-sm">
                {Math.round(totals.calories)}
                {targets && (
                  <span className="text-muted-foreground">
                    {" "}
                    / {targets.calories} kcal
                  </span>
                )}
              </span>
            </div>
            {targets && <Progress value={calorieProgress} className="h-2" />}
          </div>

          {/* PFC */}
          <div className="grid grid-cols-3 gap-4">
            {/* タンパク質 */}
            <div>
              <div className="mb-1 flex items-center justify-between">
                <span className="text-muted-foreground text-xs">P</span>
                <span className="text-xs">
                  {totals.protein.toFixed(1)}
                  {targets && (
                    <span className="text-muted-foreground">
                      /{targets.protein}g
                    </span>
                  )}
                </span>
              </div>
              {targets && (
                <Progress
                  value={Math.min(
                    100,
                    (totals.protein / targets.protein) * 100
                  )}
                  className="h-1.5"
                />
              )}
            </div>

            {/* 脂質 */}
            <div>
              <div className="mb-1 flex items-center justify-between">
                <span className="text-muted-foreground text-xs">F</span>
                <span className="text-xs">
                  {totals.fat.toFixed(1)}
                  {targets && (
                    <span className="text-muted-foreground">
                      /{targets.fat}g
                    </span>
                  )}
                </span>
              </div>
              {targets && (
                <Progress
                  value={Math.min(100, (totals.fat / targets.fat) * 100)}
                  className="h-1.5"
                />
              )}
            </div>

            {/* 炭水化物 */}
            <div>
              <div className="mb-1 flex items-center justify-between">
                <span className="text-muted-foreground text-xs">C</span>
                <span className="text-xs">
                  {totals.carbohydrate.toFixed(1)}
                  {targets && (
                    <span className="text-muted-foreground">
                      /{targets.carbohydrate}g
                    </span>
                  )}
                </span>
              </div>
              {targets && (
                <Progress
                  value={Math.min(
                    100,
                    (totals.carbohydrate / targets.carbohydrate) * 100
                  )}
                  className="h-1.5"
                />
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
