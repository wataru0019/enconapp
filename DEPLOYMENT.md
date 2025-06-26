# EnconApp デプロイメントガイド

## 概要
このガイドでは、EnconAppをCloudflare Workersにデプロイする手順を説明します。

## 前提条件
- Cloudflareアカウント
- Wrangler CLI がインストール済み
- Anthropic API キー

## デプロイ手順

### 1. Cloudflare認証
```bash
pnpm wrangler login
```

### 2. D1データベースの作成
```bash
pnpm wrangler d1 create enconapp-db
```

出力されたdatabase_idをコピーして、`wrangler.toml`の`database_id`フィールドを更新してください。

### 3. データベーススキーマの適用
```bash
pnpm wrangler d1 execute enconapp-db --file=./src/lib/db/schema-d1.sql
```

### 4. 環境変数（シークレット）の設定
```bash
# JWT署名用の秘密鍵を設定
pnpm wrangler secret put JWT_SECRET

# Anthropic API キーを設定  
pnpm wrangler secret put ANTHROPIC_API_KEY
```

### 5. アプリケーションのビルドとデプロイ
```bash
# 開発環境にデプロイ
pnpm run deploy:dev

# 本番環境にデプロイ
pnpm run deploy:prod
```

## 本番環境での確認事項

### セキュリティ
- [ ] JWT_SECRETが強力な秘密鍵に設定されている
- [ ] ANTHROPIC_API_KEYが正しく設定されている
- [ ] 不要な環境変数が含まれていない

### データベース
- [ ] D1データベースが正常に作成されている
- [ ] スキーマが正しく適用されている
- [ ] データベースアクセスが正常に動作している

### 機能テスト
- [ ] ユーザー登録が動作する
- [ ] ログインが動作する
- [ ] チャット機能が動作する
- [ ] 辞書機能が動作する
- [ ] チャット履歴が保存される

## トラブルシューティング

### よくある問題

#### 1. D1データベース接続エラー
- `wrangler.toml`のdatabase_idが正しく設定されているか確認
- データベースが正しく作成されているか確認：`pnpm wrangler d1 list`

#### 2. 環境変数エラー
- シークレットが正しく設定されているか確認：`pnpm wrangler secret list`
- 必要なシークレットが全て設定されているか確認

#### 3. ビルドエラー
- 依存関係が正しくインストールされているか確認：`pnpm install`
- TypeScriptエラーがないか確認：`pnpm run check`

### ログの確認
```bash
# リアルタイムログを確認
pnpm wrangler tail

# 特定の環境のログを確認
pnpm wrangler tail --env production
```

## 監視とメンテナンス

### パフォーマンス監視
- Cloudflare Dashboardでメトリクスを確認
- レスポンス時間とエラー率を監視
- API使用量の監視

### 定期メンテナンス
- 定期的にログを確認
- データベースのバックアップ検討
- セキュリティアップデートの適用

## コスト最適化

### Cloudflare Workers
- 無料枠：100,000リクエスト/日
- 有料プラン：$5/月で10Mリクエスト

### Cloudflare D1
- 無料枠：100,000読み取り、50,000書き込み/日
- 有料プラン：使用量に応じた従量課金

### Anthropic API
- Claude 3.5 Haiku: 入力$0.25/MTok、出力$1.25/MTok
- 使用量に応じてコスト管理

## 参考リンク
- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
- [Cloudflare D1 Documentation](https://developers.cloudflare.com/d1/)
- [SvelteKit Cloudflare Adapter](https://kit.svelte.dev/docs/adapter-cloudflare)
- [Wrangler CLI Documentation](https://developers.cloudflare.com/workers/wrangler/)