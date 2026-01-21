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
| デプロイ       | Google Cloud Run            |

## プロジェクト構成

```
my-nutri-log/
├── .husky/                 # Git hooks
├── docs/                   # 設計ドキュメント
│   ├── database-design.md  # ER図・テーブル定義
│   ├── screen-design.md    # 画面定義書
│   ├── api-design.md       # API設計書
│   └── test-specification.md # テスト仕様書
├── prisma/
│   └── schema.prisma       # DBスキーマ定義
├── src/
│   ├── app/                # Next.js App Router (ページ・レイアウト)
│   ├── components/
│   │   └── ui/             # shadcn/uiコンポーネント
│   ├── lib/
│   │   ├── prisma.ts       # Prismaクライアント
│   │   └── utils.ts        # ユーティリティ関数
│   └── test/               # テストファイル
├── public/                 # 静的ファイル
├── .env                    # 環境変数（Git管理外）
├── eslint.config.mjs       # ESLint設定
├── .prettierrc             # Prettier設定
├── vitest.config.mts       # Vitest設定
└── tsconfig.json           # TypeScript設定
```

## 開発コマンド

```bash
# 開発
npm run dev              # 開発サーバー起動 (http://localhost:3000)
npm run build            # プロダクションビルド
npm run start            # プロダクションサーバー起動

# コード品質
npm run lint             # ESLint実行
npm run lint:fix         # ESLint自動修正
npm run format           # Prettier整形
npm run format:check     # Prettier整形チェック

# テスト
npm run test             # Vitest（watchモード）
npm run test:run         # Vitest（単発実行）
npm run test:coverage    # カバレッジ取得

# データベース
npm run prisma:generate  # Prismaクライアント生成
npm run prisma:push      # スキーマをDBに反映
npm run prisma:migrate   # マイグレーション作成・実行
npm run prisma:studio    # Prisma Studio起動
```

## 開発ルール

### コーディング規約

- **インポート順序**: builtin → external → internal → parent/sibling → index → type
- **未使用変数**: `_` プレフィックスで許可（例: `_unused`）
- **console.log**: 禁止（`console.warn`/`console.error`のみ許可）
- **型定義**: `any` は警告、明示的な型定義を推奨

### コミット前チェック

Huskyにより、コミット時に以下が自動実行される:

- ESLint --fix
- Prettier --write

### ブランチ戦略

- `main`: 本番環境
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

`.env`ファイルに以下を設定:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/mynutrilog?schema=public"
```

## 設計ドキュメント

詳細な設計は以下を参照:

@docs/database-design.md
@docs/api-design.md
@docs/screen-design.md
@docs/test-specification.md

## 注意事項

- Node.js v20.19以上を推奨（現在v20.11.1で一部警告あり）
- PostgreSQLが必要（ローカル開発時）
- `.env`ファイルはGit管理外
