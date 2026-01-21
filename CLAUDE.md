# CLAUDE.md - My Nutri Log

## プロジェクト概要

カロリー・PFCバランス管理アプリ。食事内容を入力し、摂取カロリーとPFCバランスを計算・管理する。

### 主要機能

- ユーザー認証（登録・ログイン・ログアウト）
- 食事記録（朝食・昼食・夕食・間食）
- カレンダー表示・日次集計
- 食品マスタ管理
- 目標値設定（カロリー・PFC）

## 技術スタック

| カテゴリ       | 技術                        |
| -------------- | --------------------------- |
| 言語           | TypeScript                  |
| フレームワーク | Next.js 16 (App Router)     |
| UI             | shadcn/ui + Tailwind CSS v4 |
| DB             | PostgreSQL + Prisma v5      |
| APIスキーマ    | OpenAPI (Zodによる検証)     |
| テスト         | Vitest + Testing Library    |
| Linter         | ESLint v9 + Prettier        |
| Git Hooks      | Husky + lint-staged         |
| CI/CD          | GitHub Actions              |
| デプロイ       | Google Cloud Run            |

## 環境構成

| 環境     | DB                  | ホスティング     |
| -------- | ------------------- | ---------------- |
| ローカル | Docker PostgreSQL   | localhost:3000   |
| 本番     | Supabase PostgreSQL | Google Cloud Run |

## プロジェクト構成

```
my-nutri-log/
├── .github/
│   └── workflows/
│       ├── ci.yml              # CI（Lint, Test, Build）
│       └── cd.yml              # CD（Cloud Runデプロイ）
├── .husky/                     # Git hooks
├── docs/                       # 設計ドキュメント
│   ├── database-design.md      # ER図・テーブル定義
│   ├── screen-design.md        # 画面定義書
│   ├── api-design.md           # API設計書
│   ├── test-specification.md   # テスト仕様書
│   └── deployment.md           # デプロイ手順書
├── prisma/
│   └── schema.prisma           # DBスキーマ定義
├── src/
│   ├── app/                    # Next.js App Router
│   ├── components/ui/          # shadcn/uiコンポーネント
│   ├── lib/
│   │   ├── prisma.ts           # Prismaクライアント
│   │   └── utils.ts            # ユーティリティ関数
│   └── test/                   # テストファイル
├── public/                     # 静的ファイル
├── Dockerfile                  # Docker設定
├── docker-compose.yml          # ローカルDB設定
├── Makefile                    # デプロイ・開発コマンド
├── .env.example                # 環境変数サンプル
└── .env.local                  # 環境変数（Git管理外）
```

## Makeコマンド

```bash
# ヘルプ表示
make help

# ローカル開発
make dev              # 開発サーバー起動
make build            # プロダクションビルド
make lint             # ESLint実行
make test             # テスト実行

# ローカルDB
make db-up            # PostgreSQL起動
make db-down          # PostgreSQL停止
make db-reset         # DBリセット

# Prisma
make prisma-generate  # クライアント生成
make prisma-push      # スキーマ反映
make prisma-migrate   # マイグレーション
make prisma-studio    # Prisma Studio起動

# デプロイ
make deploy           # フルデプロイ（ビルド&デプロイ）
make deploy-build     # Cloud Buildでビルド
make deploy-run       # Cloud Runにデプロイ
make deploy-status    # デプロイ状態確認
make deploy-logs      # ログ表示
```

## 開発フロー

### 初回セットアップ

```bash
make setup            # npm install & .env.example → .env.local
make db-up            # ローカルDB起動
make prisma-push      # スキーマ反映
make dev              # 開発サーバー起動
```

### 日常開発

```bash
make db-up            # DB起動（未起動の場合）
make dev              # 開発サーバー起動
# コード編集...
make test             # テスト実行
git add . && git commit  # Huskyが自動でlint/format
git push origin main  # 自動デプロイ
```

## CI/CD パイプライン

### CI（Pull Request時 & Push時）

1. **Lint & Type Check** - ESLint, TypeScript
2. **Test** - Vitest
3. **Build** - Next.js ビルド

### CD（main Push時）

1. Docker イメージビルド
2. Artifact Registry にプッシュ
3. Cloud Run にデプロイ

## 開発ルール

### コーディング規約

- **未使用変数**: `_` プレフィックスで許可（例: `_unused`）
- **console.log**: 禁止（`console.warn`/`console.error`のみ許可）
- **型定義**: `any` は警告、明示的な型定義を推奨

### コミット前チェック

Huskyにより、コミット時に以下が自動実行される:

- ESLint --fix
- Prettier --write

### ブランチ戦略

- `main`: 本番環境（自動デプロイ）
- `develop`: 開発統合ブランチ
- `feature/*`: 機能開発
- `fix/*`: バグ修正

### コミットメッセージ

```
<type>: <subject>

type:
- feat: 新機能
- fix: バグ修正
- docs: ドキュメント
- style: コードスタイル
- refactor: リファクタリング
- test: テスト
- chore: ビルド・設定
```

## 環境変数

`.env.local`ファイルに以下を設定:

```env
# ローカル開発用
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/mynutrilog?schema=public"

# 本番環境用（Supabase）
# DATABASE_URL="postgresql://postgres:xxx@db.xxx.supabase.co:5432/postgres"
```

## 設計ドキュメント

@docs/database-design.md
@docs/api-design.md
@docs/screen-design.md
@docs/test-specification.md
@docs/deployment.md

## 注意事項

- Node.js v20.19以上を推奨
- ローカル開発にはDocker Desktopが必要
- `.env.local`ファイルはGit管理外
- 本番DBはSupabase（無料枠500MB）
- Windowsでは`make`コマンド使用にChocolatey等でのインストールが必要

## 開発状況

### 完了済み

- [x] プロジェクト初期セットアップ
- [x] 設計ドキュメント作成（DB、API、画面、テスト仕様）
- [x] Prismaスキーマ定義
- [x] ESLint/Prettier/Husky設定
- [x] CI/CDパイプライン構築
- [x] Supabase本番DB接続設定
- [x] GCP環境設定（Workload Identity Federation）
- [x] GitHub Secrets設定

### 次のステップ

- [ ] 認証機能実装（NextAuth.js）
- [ ] API実装（Route Handlers）
- [ ] 画面実装（shadcn/ui）
- [ ] テスト作成
