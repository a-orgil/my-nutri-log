import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Docker用のスタンドアロン出力
  output: "standalone",
  // 日本語パス対応のためTurbopackを無効化（ローカル開発時）
  // CI/CD環境ではこの問題は発生しない
};

export default nextConfig;
