"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PFCBalanceChart } from "./pfc-balance-chart";
import { foodFormSchema, servingUnits, type FoodFormInput } from "@/lib/foods";

interface FoodFormProps {
  defaultValues?: Partial<FoodFormInput>;
  onSubmit: (data: FoodFormInput) => Promise<void>;
  isLoading?: boolean;
  mode: "create" | "edit";
}

export function FoodForm({
  defaultValues,
  onSubmit,
  isLoading = false,
  mode,
}: FoodFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FoodFormInput>({
    resolver: zodResolver(foodFormSchema),
    defaultValues: {
      name: "",
      calories: 0,
      protein: 0,
      fat: 0,
      carbohydrate: 0,
      servingSize: 100,
      servingUnit: "g",
      ...defaultValues,
    },
  });

  const protein = watch("protein") || 0;
  const fat = watch("fat") || 0;
  const carbohydrate = watch("carbohydrate") || 0;
  const servingUnit = watch("servingUnit");

  return (
    <Card>
      <CardHeader>
        <CardTitle>{mode === "create" ? "食品を登録" : "食品を編集"}</CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          {/* 食品名 */}
          <div className="space-y-2">
            <Label htmlFor="name">食品名 *</Label>
            <Input
              id="name"
              type="text"
              placeholder="例: 鶏むね肉"
              {...register("name")}
              disabled={isLoading}
            />
            {errors.name && (
              <p className="text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          {/* 基準量・単位 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="servingSize">基準量 *</Label>
              <Input
                id="servingSize"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="100"
                {...register("servingSize", { valueAsNumber: true })}
                disabled={isLoading}
              />
              {errors.servingSize && (
                <p className="text-sm text-red-600">
                  {errors.servingSize.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="servingUnit">単位 *</Label>
              <Select
                value={servingUnit}
                onValueChange={(value) =>
                  setValue("servingUnit", value as FoodFormInput["servingUnit"])
                }
                disabled={isLoading}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="単位を選択" />
                </SelectTrigger>
                <SelectContent>
                  {servingUnits.map((unit) => (
                    <SelectItem key={unit} value={unit}>
                      {unit}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.servingUnit && (
                <p className="text-sm text-red-600">
                  {errors.servingUnit.message}
                </p>
              )}
            </div>
          </div>

          {/* カロリー */}
          <div className="space-y-2">
            <Label htmlFor="calories">カロリー (kcal) *</Label>
            <Input
              id="calories"
              type="number"
              step="0.01"
              min="0"
              placeholder="0"
              {...register("calories", { valueAsNumber: true })}
              disabled={isLoading}
            />
            {errors.calories && (
              <p className="text-sm text-red-600">{errors.calories.message}</p>
            )}
          </div>

          {/* PFC */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="protein">タンパク質 (g) *</Label>
              <Input
                id="protein"
                type="number"
                step="0.01"
                min="0"
                placeholder="0"
                {...register("protein", { valueAsNumber: true })}
                disabled={isLoading}
              />
              {errors.protein && (
                <p className="text-sm text-red-600">{errors.protein.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="fat">脂質 (g) *</Label>
              <Input
                id="fat"
                type="number"
                step="0.01"
                min="0"
                placeholder="0"
                {...register("fat", { valueAsNumber: true })}
                disabled={isLoading}
              />
              {errors.fat && (
                <p className="text-sm text-red-600">{errors.fat.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="carbohydrate">炭水化物 (g) *</Label>
              <Input
                id="carbohydrate"
                type="number"
                step="0.01"
                min="0"
                placeholder="0"
                {...register("carbohydrate", { valueAsNumber: true })}
                disabled={isLoading}
              />
              {errors.carbohydrate && (
                <p className="text-sm text-red-600">
                  {errors.carbohydrate.message}
                </p>
              )}
            </div>
          </div>

          {/* PFCバランスチャート */}
          <div className="space-y-2">
            <Label>PFCバランス</Label>
            <div className="rounded-lg border p-4">
              <PFCBalanceChart
                protein={protein}
                fat={fat}
                carbohydrate={carbohydrate}
                size="md"
              />
            </div>
          </div>
        </CardContent>

        <CardFooter>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading
              ? mode === "create"
                ? "登録中..."
                : "更新中..."
              : mode === "create"
                ? "登録する"
                : "更新する"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
