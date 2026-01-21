# デプロイ手順書

## 概要

本ドキュメントでは、My Nutri Logアプリのデプロイ手順を説明します。

## 環境構成

| 環境     | DB                  | ホスティング     |
| -------- | ------------------- | ---------------- |
| ローカル | Docker PostgreSQL   | localhost:3000   |
| 本番     | Supabase PostgreSQL | Google Cloud Run |

---

## 1. ローカル環境セットアップ

### 1.1 前提条件

- Node.js v20.19以上
- Docker Desktop
- Git

### 1.2 初期セットアップ

```bash
# リポジトリクローン
git clone https://github.com/a-orgil/my-nutri-log.git
cd my-nutri-log

# 依存関係インストール & 環境変数設定
make setup

# .env.local を編集
# DATABASE_URL を設定
```

### 1.3 ローカルDB起動

```bash
# PostgreSQL起動
make db-up

# DBスキーマ反映
make prisma-push

# Prismaクライアント生成
make prisma-generate
```

### 1.4 開発サーバー起動

```bash
make dev
# http://localhost:3000 でアクセス
```

### 1.5 その他のコマンド

```bash
make db-down      # DB停止
make db-reset     # DBリセット
make prisma-studio # Prisma Studio起動
```

---

## 2. Supabase セットアップ（本番DB）

### 2.1 プロジェクト作成

1. [Supabase](https://supabase.com) にログイン
2. 「New Project」でプロジェクト作成
   - Name: `my-nutri-log`
   - Database Password: 強力なパスワードを設定
   - Region: `Northeast Asia (Tokyo)`
3. プロジェクト作成完了まで待機

### 2.2 接続情報取得

1. Settings → Database → Connection string
2. 「URI」タブで接続文字列をコピー
3. `[YOUR-PASSWORD]` を設定したパスワードに置換

```
postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
```

### 2.3 スキーマ反映

```bash
# .env.local に本番DB URLを設定（一時的に）
DATABASE_URL="postgresql://postgres:xxx@db.xxx.supabase.co:5432/postgres"

# スキーマ反映
make prisma-push
```

---

## 3. Google Cloud セットアップ

### 3.1 前提条件

- Google Cloud アカウント
- gcloud CLI インストール済み

### 3.2 GCPプロジェクト設定

```bash
# GCPにログイン
gcloud auth login

# プロジェクト設定
gcloud config set project my-nutri-log

# 必要なAPIを有効化
make setup-gcp
```

### 3.3 Artifact Registry 作成

```bash
# Artifact Registry リポジトリ作成
gcloud artifacts repositories create my-nutri-log \
  --repository-format=docker \
  --location=asia-northeast1 \
  --description="My Nutri Log Docker images"
```

### 3.4 Secret Manager 設定

```bash
# DATABASE_URL をSecret Managerに登録
echo -n "postgresql://postgres:xxx@db.xxx.supabase.co:5432/postgres" | \
  gcloud secrets create DATABASE_URL --data-file=-

# Cloud Runサービスアカウントにアクセス権付与
gcloud secrets add-iam-policy-binding DATABASE_URL \
  --member="serviceAccount:[PROJECT-NUMBER]-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

### 3.5 Workload Identity Federation 設定（GitHub Actions用）

```bash
# Workload Identity Pool 作成
gcloud iam workload-identity-pools create "github-pool" \
  --location="global" \
  --display-name="GitHub Actions Pool"

# Provider 作成
gcloud iam workload-identity-pools providers create-oidc "github-provider" \
  --location="global" \
  --workload-identity-pool="github-pool" \
  --display-name="GitHub Provider" \
  --attribute-mapping="google.subject=assertion.sub,attribute.actor=assertion.actor,attribute.repository=assertion.repository" \
  --attribute-condition="assertion.repository=='a-orgil/my-nutri-log'" \
  --issuer-uri="https://token.actions.githubusercontent.com"

# サービスアカウント作成
gcloud iam service-accounts create github-actions \
  --display-name="GitHub Actions Service Account"

# 必要な権限付与
gcloud projects add-iam-policy-binding my-nutri-log \
  --member="serviceAccount:github-actions@my-nutri-log.iam.gserviceaccount.com" \
  --role="roles/run.admin"

gcloud projects add-iam-policy-binding my-nutri-log \
  --member="serviceAccount:github-actions@my-nutri-log.iam.gserviceaccount.com" \
  --role="roles/artifactregistry.writer"

gcloud projects add-iam-policy-binding my-nutri-log \
  --member="serviceAccount:github-actions@my-nutri-log.iam.gserviceaccount.com" \
  --role="roles/iam.serviceAccountUser"

# Workload Identity 連携設定
gcloud iam service-accounts add-iam-policy-binding \
  github-actions@my-nutri-log.iam.gserviceaccount.com \
  --role="roles/iam.workloadIdentityUser" \
  --member="principalSet://iam.googleapis.com/projects/[PROJECT-NUMBER]/locations/global/workloadIdentityPools/github-pool/attribute.repository/a-orgil/my-nutri-log"
```

### 3.6 GitHub Secrets 設定

GitHubリポジトリの Settings → Secrets and variables → Actions に以下を設定:

| Secret Name           | Value                                                                                                    |
| --------------------- | -------------------------------------------------------------------------------------------------------- |
| `WIF_PROVIDER`        | `projects/[PROJECT-NUMBER]/locations/global/workloadIdentityPools/github-pool/providers/github-provider` |
| `WIF_SERVICE_ACCOUNT` | `github-actions@my-nutri-log.iam.gserviceaccount.com`                                                    |

---

## 4. デプロイ

### 4.1 自動デプロイ（推奨）

`main` ブランチにpushすると自動的にデプロイされます。

```bash
git push origin main
```

GitHub Actionsで以下が実行されます:

1. CI: Lint → Test → Build
2. CD: Docker Build → Push → Cloud Run Deploy

### 4.2 手動デプロイ

```bash
# ローカルからデプロイ
make deploy

# または個別に実行
make deploy-build  # Cloud Buildでイメージビルド
make deploy-run    # Cloud Runにデプロイ
```

### 4.3 デプロイ確認

```bash
# デプロイ状態確認
make deploy-status

# デプロイURL表示
make deploy-url

# ログ確認
make deploy-logs
```

---

## 5. トラブルシューティング

### DB接続エラー

```
Error: Can't reach database server
```

**対処法:**

- Supabaseの接続文字列を確認
- Secret Managerの値を確認
- Cloud Runのサービスアカウント権限を確認

### ビルドエラー

```
Error: prisma generate failed
```

**対処法:**

- `prisma/schema.prisma` の構文確認
- `npm run prisma:generate` をローカルで実行してエラー確認

### デプロイエラー

```
ERROR: (gcloud.run.deploy) PERMISSION_DENIED
```

**対処法:**

- Workload Identity Federation の設定確認
- サービスアカウントの権限確認
- GitHub Secretsの値確認

---

## 6. 参考リンク

- [Supabase Documentation](https://supabase.com/docs)
- [Google Cloud Run Documentation](https://cloud.google.com/run/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
