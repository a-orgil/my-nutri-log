"use client";

import { useState, useEffect, useCallback } from "react";
import { signOut } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { TargetForm } from "@/components/settings";
import { TargetsFormInput } from "@/lib/users";
import { toast } from "sonner";
import { ChevronRight, LogOut } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface UserData {
  id: number;
  name: string;
  email: string;
  daily_calorie_target: number;
  daily_protein_target: number;
  daily_fat_target: number;
  daily_carb_target: number;
}

export default function SettingsPage() {
  const [user, setUser] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // ユーザー情報を取得
  const fetchUser = useCallback(async () => {
    try {
      const res = await fetch("/api/v1/users/me");
      const data = await res.json();
      if (data.success) {
        setUser(data.data);
        setEditName(data.data.name);
        setEditEmail(data.data.email);
      }
    } catch (error) {
      console.error("Failed to fetch user:", error);
      toast.error("ユーザー情報の取得に失敗しました");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  // 目標値を保存
  const handleSaveTargets = async (data: TargetsFormInput) => {
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/v1/users/me/targets", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (result.success) {
        setUser((prev) =>
          prev
            ? {
                ...prev,
                daily_calorie_target: result.data.daily_calorie_target,
                daily_protein_target: result.data.daily_protein_target,
                daily_fat_target: result.data.daily_fat_target,
                daily_carb_target: result.data.daily_carb_target,
              }
            : null
        );
        toast.success("目標値を保存しました");
      } else {
        toast.error(result.error?.message || "保存に失敗しました");
      }
    } catch (error) {
      console.error("Failed to save targets:", error);
      toast.error("保存に失敗しました");
    } finally {
      setIsSubmitting(false);
    }
  };

  // プロフィールを保存
  const handleSaveProfile = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/v1/users/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName, email: editEmail }),
      });
      const result = await res.json();
      if (result.success) {
        setUser((prev) =>
          prev
            ? { ...prev, name: result.data.name, email: result.data.email }
            : null
        );
        setIsEditingProfile(false);
        toast.success("プロフィールを更新しました");
      } else {
        toast.error(result.error?.message || "更新に失敗しました");
      }
    } catch (error) {
      console.error("Failed to save profile:", error);
      toast.error("更新に失敗しました");
    } finally {
      setIsSubmitting(false);
    }
  };

  // パスワードを変更
  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast.error("新しいパスワードが一致しません");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/v1/users/me/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });
      const result = await res.json();
      if (result.success) {
        setIsChangingPassword(false);
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        toast.success("パスワードを変更しました");
      } else {
        toast.error(result.error?.message || "パスワード変更に失敗しました");
      }
    } catch (error) {
      console.error("Failed to change password:", error);
      toast.error("パスワード変更に失敗しました");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ログアウト
  const handleLogout = async () => {
    await signOut({ callbackUrl: "/login" });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-32" />
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-24" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">設定</h1>

      {/* アカウント情報 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">アカウント</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isEditingProfile ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="name">ユーザー名</Label>
                <Input
                  id="name"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">メールアドレス</Label>
                <Input
                  id="email"
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleSaveProfile}
                  disabled={isSubmitting}
                  className="flex-1"
                >
                  {isSubmitting ? "保存中..." : "保存"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsEditingProfile(false);
                    setEditName(user?.name || "");
                    setEditEmail(user?.email || "");
                  }}
                  className="flex-1"
                >
                  キャンセル
                </Button>
              </div>
            </>
          ) : (
            <>
              <button
                onClick={() => setIsEditingProfile(true)}
                className="hover:bg-muted/50 -mx-2 flex w-full items-center justify-between rounded-lg px-2 py-2 text-left"
              >
                <div>
                  <div className="text-muted-foreground text-sm">
                    ユーザー名
                  </div>
                  <div className="font-medium">{user?.name}</div>
                </div>
                <ChevronRight className="text-muted-foreground h-4 w-4" />
              </button>
              <button
                onClick={() => setIsEditingProfile(true)}
                className="hover:bg-muted/50 -mx-2 flex w-full items-center justify-between rounded-lg px-2 py-2 text-left"
              >
                <div>
                  <div className="text-muted-foreground text-sm">
                    メールアドレス
                  </div>
                  <div className="font-medium">{user?.email}</div>
                </div>
                <ChevronRight className="text-muted-foreground h-4 w-4" />
              </button>
              <button
                onClick={() => setIsChangingPassword(true)}
                className="hover:bg-muted/50 -mx-2 flex w-full items-center justify-between rounded-lg px-2 py-2 text-left"
              >
                <div className="font-medium">パスワード変更</div>
                <ChevronRight className="text-muted-foreground h-4 w-4" />
              </button>
            </>
          )}
        </CardContent>
      </Card>

      {/* パスワード変更ダイアログ */}
      {isChangingPassword && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">パスワード変更</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">現在のパスワード</Label>
              <Input
                id="currentPassword"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">新しいパスワード</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">新しいパスワード（確認）</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleChangePassword}
                disabled={isSubmitting || !currentPassword || !newPassword}
                className="flex-1"
              >
                {isSubmitting ? "変更中..." : "変更する"}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setIsChangingPassword(false);
                  setCurrentPassword("");
                  setNewPassword("");
                  setConfirmPassword("");
                }}
                className="flex-1"
              >
                キャンセル
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 目標値設定 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">1日の目標</CardTitle>
        </CardHeader>
        <CardContent>
          {user && (
            <TargetForm
              defaultValues={{
                dailyCalorieTarget: user.daily_calorie_target,
                dailyProteinTarget: user.daily_protein_target,
                dailyFatTarget: user.daily_fat_target,
                dailyCarbTarget: user.daily_carb_target,
              }}
              onSubmit={handleSaveTargets}
              isSubmitting={isSubmitting}
            />
          )}
        </CardContent>
      </Card>

      {/* ログアウト */}
      <Card>
        <CardContent className="pt-6">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="w-full">
                <LogOut className="mr-2 h-4 w-4" />
                ログアウト
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>ログアウトしますか？</AlertDialogTitle>
                <AlertDialogDescription>
                  ログアウトすると、再度ログインが必要になります。
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>キャンセル</AlertDialogCancel>
                <AlertDialogAction onClick={handleLogout}>
                  ログアウト
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  );
}
