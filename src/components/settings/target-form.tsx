"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { targetsFormSchema, TargetsFormInput } from "@/lib/users";

interface TargetFormProps {
  defaultValues: TargetsFormInput;
  onSubmit: (data: TargetsFormInput) => Promise<void>;
  isSubmitting?: boolean;
}

export function TargetForm({
  defaultValues,
  onSubmit,
  isSubmitting,
}: TargetFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TargetsFormInput>({
    resolver: zodResolver(targetsFormSchema),
    defaultValues,
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="dailyCalorieTarget">目標カロリー (kcal)</Label>
        <Input
          id="dailyCalorieTarget"
          type="number"
          {...register("dailyCalorieTarget", { valueAsNumber: true })}
          placeholder="2000"
        />
        {errors.dailyCalorieTarget && (
          <p className="text-destructive text-sm">
            {errors.dailyCalorieTarget.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="dailyProteinTarget">目標タンパク質 (g)</Label>
        <Input
          id="dailyProteinTarget"
          type="number"
          {...register("dailyProteinTarget", { valueAsNumber: true })}
          placeholder="60"
        />
        {errors.dailyProteinTarget && (
          <p className="text-destructive text-sm">
            {errors.dailyProteinTarget.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="dailyFatTarget">目標脂質 (g)</Label>
        <Input
          id="dailyFatTarget"
          type="number"
          {...register("dailyFatTarget", { valueAsNumber: true })}
          placeholder="55"
        />
        {errors.dailyFatTarget && (
          <p className="text-destructive text-sm">
            {errors.dailyFatTarget.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="dailyCarbTarget">目標炭水化物 (g)</Label>
        <Input
          id="dailyCarbTarget"
          type="number"
          {...register("dailyCarbTarget", { valueAsNumber: true })}
          placeholder="300"
        />
        {errors.dailyCarbTarget && (
          <p className="text-destructive text-sm">
            {errors.dailyCarbTarget.message}
          </p>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "保存中..." : "目標を保存"}
      </Button>
    </form>
  );
}
