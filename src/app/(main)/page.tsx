import Link from "next/link";
import { auth } from "@/../auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, UtensilsCrossed } from "lucide-react";

export default async function HomePage() {
  const session = await auth();

  return (
    <div className="space-y-6">
      {/* ウェルカムメッセージ */}
      <div>
        <h1 className="text-2xl font-bold">
          こんにちは、{session?.user?.name}さん
        </h1>
        <p className="text-muted-foreground">今日の食事を記録しましょう</p>
      </div>

      {/* クイックアクション */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">食事を記録</CardTitle>
            <Plus className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4 text-xs">
              今日の食事を記録して、カロリーとPFCバランスを管理しましょう
            </p>
            <Button asChild className="w-full">
              <Link href="/meals/new">食事を記録する</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">食品マスタ</CardTitle>
            <UtensilsCrossed className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4 text-xs">
              よく食べる食品を登録して、記録を簡単にしましょう
            </p>
            <Button asChild variant="outline" className="w-full">
              <Link href="/foods">食品を管理する</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* 今後実装予定のセクション */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">本日のサマリー</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            食事記録機能実装後に表示されます
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
