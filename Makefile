# =============================================================================
# My Nutri Log - Makefile
# =============================================================================

# 変数定義
PROJECT_ID := my-nutri-log
REGION := asia-northeast1
SERVICE_NAME := my-nutri-log
IMAGE_NAME := gcr.io/$(PROJECT_ID)/$(SERVICE_NAME)

# =============================================================================
# ローカル開発
# =============================================================================

.PHONY: dev
dev: ## 開発サーバー起動
	npm run dev

.PHONY: build
build: ## プロダクションビルド
	npm run build

.PHONY: start
start: ## プロダクションサーバー起動
	npm run start

.PHONY: lint
lint: ## ESLint実行
	npm run lint

.PHONY: lint-fix
lint-fix: ## ESLint自動修正
	npm run lint:fix

.PHONY: format
format: ## Prettier整形
	npm run format

.PHONY: test
test: ## テスト実行（watchモード）
	npm run test

.PHONY: test-run
test-run: ## テスト実行（単発）
	npm run test:run

.PHONY: test-coverage
test-coverage: ## テストカバレッジ取得
	npm run test:coverage

# =============================================================================
# ローカルDB (Docker)
# =============================================================================

.PHONY: db-up
db-up: ## ローカルPostgreSQLを起動
	docker compose up -d db

.PHONY: db-down
db-down: ## ローカルPostgreSQLを停止
	docker compose down

.PHONY: db-logs
db-logs: ## DBログ表示
	docker compose logs -f db

.PHONY: db-reset
db-reset: ## DBをリセット（データ削除）
	docker compose down -v
	docker compose up -d db
	sleep 3
	npm run prisma:push

# =============================================================================
# Prisma
# =============================================================================

.PHONY: prisma-generate
prisma-generate: ## Prismaクライアント生成
	npm run prisma:generate

.PHONY: prisma-push
prisma-push: ## スキーマをDBに反映
	npm run prisma:push

.PHONY: prisma-migrate
prisma-migrate: ## マイグレーション作成・実行
	npm run prisma:migrate

.PHONY: prisma-studio
prisma-studio: ## Prisma Studio起動
	npm run prisma:studio

.PHONY: prisma-seed
prisma-seed: ## シードデータ投入
	npx prisma db seed

# =============================================================================
# Docker
# =============================================================================

.PHONY: docker-build
docker-build: ## Dockerイメージをビルド
	docker build -t $(IMAGE_NAME):latest .

.PHONY: docker-run
docker-run: ## ローカルでDockerコンテナ実行
	docker run -p 3000:3000 --env-file .env.local $(IMAGE_NAME):latest

.PHONY: docker-push
docker-push: ## GCRにイメージをプッシュ
	docker push $(IMAGE_NAME):latest

# =============================================================================
# Google Cloud Run デプロイ
# =============================================================================

.PHONY: gcloud-auth
gcloud-auth: ## GCPにログイン
	gcloud auth login
	gcloud config set project $(PROJECT_ID)

.PHONY: gcloud-docker-auth
gcloud-docker-auth: ## GCRへのDocker認証設定
	gcloud auth configure-docker

.PHONY: deploy-build
deploy-build: ## Cloud Build でビルド
	gcloud builds submit --tag $(IMAGE_NAME):latest

.PHONY: deploy-run
deploy-run: ## Cloud Run にデプロイ
	gcloud run deploy $(SERVICE_NAME) \
		--image $(IMAGE_NAME):latest \
		--platform managed \
		--region $(REGION) \
		--allow-unauthenticated \
		--set-env-vars "NODE_ENV=production"

.PHONY: deploy
deploy: deploy-build deploy-run ## ビルド & デプロイ（フルデプロイ）
	@echo "Deployment completed!"

.PHONY: deploy-status
deploy-status: ## デプロイ状態確認
	gcloud run services describe $(SERVICE_NAME) --region $(REGION)

.PHONY: deploy-logs
deploy-logs: ## Cloud Runログ表示
	gcloud run services logs read $(SERVICE_NAME) --region $(REGION) --limit 100

.PHONY: deploy-url
deploy-url: ## デプロイURLを表示
	@gcloud run services describe $(SERVICE_NAME) --region $(REGION) --format 'value(status.url)'

# =============================================================================
# セットアップ
# =============================================================================

.PHONY: setup
setup: ## 初期セットアップ
	npm install
	cp .env.example .env.local
	@echo "Setup completed! Please edit .env.local with your database credentials."

.PHONY: setup-gcp
setup-gcp: ## GCPプロジェクトセットアップ
	gcloud services enable run.googleapis.com
	gcloud services enable cloudbuild.googleapis.com
	gcloud services enable containerregistry.googleapis.com
	@echo "GCP services enabled!"

# =============================================================================
# CI/CD用
# =============================================================================

.PHONY: ci-test
ci-test: ## CI用テスト実行
	npm ci
	npm run lint
	npm run test:run

.PHONY: ci-build
ci-build: ## CI用ビルド
	npm ci
	npm run build

# =============================================================================
# ヘルプ
# =============================================================================

.PHONY: help
help: ## ヘルプ表示
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

.DEFAULT_GOAL := help
