"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { FoodSearchInput, FoodList } from "@/components/foods";
import type { Food, FoodsListResponse } from "@/lib/foods";

export default function FoodsPage() {
  const router = useRouter();
  const [foods, setFoods] = useState<Food[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFoods = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (searchQuery) params.set("q", searchQuery);
      params.set("page", String(page));
      params.set("limit", "20");

      const response = await fetch(`/api/v1/foods?${params.toString()}`);
      const result = await response.json();

      if (!response.ok) {
        setError(result.error?.message || "データの取得に失敗しました");
        return;
      }

      const data = result.data as FoodsListResponse;
      setFoods(data.foods);
      setTotalPages(data.pagination.total_pages);
    } catch {
      setError("データの取得中にエラーが発生しました");
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, page]);

  useEffect(() => {
    fetchFoods();
  }, [fetchFoods]);

  const handleSearch = useCallback((value: string) => {
    setSearchQuery(value);
    setPage(1);
  }, []);

  const handleEdit = useCallback(
    (id: number) => {
      router.push(`/foods/${id}/edit`);
    },
    [router]
  );

  const handleDeleteClick = useCallback((id: number) => {
    setDeleteTarget(id);
  }, []);

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/v1/foods/${deleteTarget}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error?.message || "削除に失敗しました");
        return;
      }

      // リストを再取得
      fetchFoods();
    } catch {
      setError("削除中にエラーが発生しました");
    } finally {
      setIsDeleting(false);
      setDeleteTarget(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">食品マスタ</h1>
        <Button asChild>
          <Link href="/foods/new">
            <Plus className="mr-2 h-4 w-4" />
            追加
          </Link>
        </Button>
      </div>

      {/* 検索 */}
      <FoodSearchInput
        value={searchQuery}
        onChange={handleSearch}
        placeholder="食品名で検索..."
      />

      {/* エラー表示 */}
      {error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* 食品リスト */}
      <FoodList
        foods={foods}
        isLoading={isLoading}
        onEdit={handleEdit}
        onDelete={handleDeleteClick}
        emptyMessage={
          searchQuery
            ? `「${searchQuery}」に一致する食品が見つかりません`
            : "食品が登録されていません"
        }
      />

      {/* ページネーション */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1 || isLoading}
          >
            前へ
          </Button>
          <span className="text-muted-foreground text-sm">
            {page} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages || isLoading}
          >
            次へ
          </Button>
        </div>
      )}

      {/* 削除確認ダイアログ */}
      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>食品を削除しますか？</AlertDialogTitle>
            <AlertDialogDescription>
              この操作は取り消せません。食品を削除すると、関連するデータも失われる可能性があります。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>
              キャンセル
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "削除中..." : "削除"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
