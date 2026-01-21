import { redirect } from "next/navigation";
import Link from "next/link";
import { auth, signOut } from "@/../auth";
import { Button } from "@/components/ui/button";
import {
  Home,
  UtensilsCrossed,
  Settings,
  LogOut,
  Utensils,
} from "lucide-react";

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="bg-background min-h-screen">
      {/* ヘッダー */}
      <header className="bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 w-full border-b backdrop-blur">
        <div className="container mx-auto flex h-14 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            My Nutri Log
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-muted-foreground text-sm">
              {session.user.name}
            </span>
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/login" });
              }}
            >
              <Button variant="ghost" size="icon-sm" type="submit">
                <LogOut className="h-4 w-4" />
                <span className="sr-only">ログアウト</span>
              </Button>
            </form>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="container mx-auto px-4 py-6">{children}</main>

      {/* フッターナビゲーション */}
      <nav className="bg-background fixed right-0 bottom-0 left-0 z-50 border-t">
        <div className="container mx-auto flex h-16 items-center justify-around px-4">
          <Link
            href="/"
            className="text-muted-foreground hover:text-foreground flex flex-col items-center gap-1"
          >
            <Home className="h-5 w-5" />
            <span className="text-xs">ホーム</span>
          </Link>
          <Link
            href="/meals"
            className="text-muted-foreground hover:text-foreground flex flex-col items-center gap-1"
          >
            <Utensils className="h-5 w-5" />
            <span className="text-xs">食事</span>
          </Link>
          <Link
            href="/foods"
            className="text-muted-foreground hover:text-foreground flex flex-col items-center gap-1"
          >
            <UtensilsCrossed className="h-5 w-5" />
            <span className="text-xs">食品</span>
          </Link>
          <Link
            href="/settings"
            className="text-muted-foreground hover:text-foreground flex flex-col items-center gap-1"
          >
            <Settings className="h-5 w-5" />
            <span className="text-xs">設定</span>
          </Link>
        </div>
      </nav>

      {/* フッターの高さ分のスペーサー */}
      <div className="h-16" />
    </div>
  );
}
