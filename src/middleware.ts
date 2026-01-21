import NextAuth from "next-auth";
import { authConfig } from "@/../auth.config";

export default NextAuth(authConfig).auth;

export const config = {
  matcher: [
    /*
     * 以下のパスを除くすべてのパスにマッチ:
     * - api/auth (NextAuth.js API routes)
     * - api/v1/auth/register (ユーザー登録API)
     * - _next/static (静的ファイル)
     * - _next/image (画像最適化)
     * - favicon.ico (ファビコン)
     * - login, register (認証画面)
     */
    "/((?!api/auth|api/v1/auth/register|_next/static|_next/image|favicon.ico|login|register).*)",
  ],
};
