"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FoodForm } from "@/components/foods";
import type { FoodFormInput } from "@/lib/foods";

export default function NewFoodPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (data: FoodFormInput) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/v1/foods", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error?.message || "登録に失敗しました");
        return;
      }

      router.push("/foods");
    } catch {
      setError("登録中にエラーが発生しました");
    } finally {
      setIsLoading(false);
    }
  };

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
        <h1 className="text-2xl font-bold">食品を登録</h1>
      </div>

      {/* エラー表示 */}
      {error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* フォーム */}
      <div className="mx-auto max-w-md">
        <FoodForm onSubmit={handleSubmit} isLoading={isLoading} mode="create" />
      </div>
    </div>
  );
}
