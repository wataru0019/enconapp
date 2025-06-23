# EnconApp 実装計画書

## 現状分析

### 既存の実装状況
- ✅ SvelteKit プロジェクト基盤構築済み
- ✅ 基本的なルーティング構成完了（/login, /main, /chat, /history）
- ✅ UI コンポーネント実装済み
- ✅ 基本的な状態管理（Svelte stores）
- ✅ 辞書パネルのスライドアニメーション実装済み

### 不足している機能
- ✅ LLM API連携（Anthropic Claude）**完了**
- ✅ 実際のユーザー認証（JWT）**完了**
- ❌ データベース連携（SQLite/Cloudflare D1）
- ❌ チャット履歴の永続化
- ❌ 本番環境へのデプロイ設定

## 実装計画

### Phase 1: API連携とLLM統合 ✅ **完了 (2025-01-22)**
**目標**: AIとの実際の会話機能を実装

#### 1.1 Anthropic API設定
- ✅ Anthropic SDKのインストール (`@anthropic-ai/sdk: ^0.54.0`)
- ✅ 環境変数設定（API キー設定済み）
- ✅ API クライアント作成

#### 1.2 チャット機能の強化
- ✅ `/src/lib/services/claude.ts` - Claude APIラッパー作成
- ✅ `/src/routes/api/chat/+server.ts` - サーバーサイドAPI作成
- ✅ チャットストアの更新（API連携対応）
- ✅ 英語応答の強制（日本語入力でも英語で応答）
- ✅ レベル別対応（初級者/中級者/上級者）
- ✅ タイピングインジケーター実装

#### 1.3 辞書機能の実装
- ✅ 辞書API エンドポイント作成 (`/api/dictionary`)
- ✅ 単語検索・翻訳機能
- ✅ 辞書パネルのAPI連携（右スライドパネル）

#### 実装詳細
- **モデル**: claude-3-5-haiku-20241022使用
- **機能**: リアルタイム英会話、レベル別応答調整、辞書検索
- **UI**: ローディング状態、エラーハンドリング、レスポンシブデザイン
- **アニメーション**: Svelteトランジション使用

**実際工数**: 1日

### Phase 2: 認証システム構築 ✅ **完了 (2025-01-23)**
**目標**: JWT ベースのユーザー認証システム

#### 2.1 認証基盤構築
- ✅ JWT ライブラリのインストール (`jsonwebtoken`, `bcryptjs`)
- ✅ `/src/lib/auth/` - 認証ユーティリティ作成
- ✅ セッション管理の実装

#### 2.2 認証フロー実装
- ✅ ログイン/ログアウト API (`/api/auth/login`, `/api/auth/register`, `/api/auth/verify`)
- ✅ 認証状態の永続化 (localStorage + サーバーサイド検証)
- ✅ ルート保護（認証必須ページ）
- ✅ ユーザー登録機能

**実際工数**: 1日

### Phase 3: データベース連携
**目標**: チャット履歴とユーザーデータの永続化

#### 3.1 開発環境（SQLite）
- [ ] SQLite設定
- [ ] データベーススキーマ設計
- [ ] マイグレーション作成

#### 3.2 データモデル設計
```sql
-- Users テーブル
CREATE TABLE users (
  id INTEGER PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Chat Sessions テーブル
CREATE TABLE chat_sessions (
  id INTEGER PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  level TEXT NOT NULL,
  topic TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Messages テーブル
CREATE TABLE messages (
  id INTEGER PRIMARY KEY,
  session_id INTEGER REFERENCES chat_sessions(id),
  sender TEXT NOT NULL, -- 'user' or 'bot'
  message TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### 3.3 データアクセス層実装
- [ ] `/src/lib/db/` - データベースアクセス層
- [ ] CRUD操作の実装
- [ ] チャット履歴の保存・取得

**予想工数**: 3-4日

### Phase 4: 本番環境対応
**目標**: Cloudflare Workers + D1 での本番運用

#### 4.1 Cloudflare Workers 対応
- [ ] `@sveltejs/adapter-cloudflare` への切り替え
- [ ] Wrangler設定
- [ ] 環境変数設定

#### 4.2 Cloudflare D1 移行
- [ ] D1データベース作成
- [ ] スキーマ移行
- [ ] 本番用データアクセス層

#### 4.3 デプロイメント
- [ ] CI/CDパイプライン構築
- [ ] 本番環境でのテスト

**予想工数**: 2-3日

## 技術スタック詳細

### フロントエンド
- **SvelteKit** - フレームワーク
- **TypeScript** - 型安全性
- **Svelte Transitions** - アニメーション

### バックエンド
- **SvelteKit API Routes** - サーバーサイドAPI
- **Anthropic SDK** - Claude API連携
- **jsonwebtoken** - JWT認証

### データベース
- **開発**: SQLite + better-sqlite3
- **本番**: Cloudflare D1

### デプロイメント
- **Cloudflare Workers** - ホスティング
- **Wrangler** - デプロイツール

## 依存関係の追加

### Phase 1で追加済み
```json
{
  "dependencies": {
    "@anthropic-ai/sdk": "^0.54.0"  // ✅ 追加済み
  }
}
```

### 今後追加予定
```json
{
  "dependencies": {
    "jsonwebtoken": "^9.0.2",
    "bcryptjs": "^2.4.3"
  },
  "devDependencies": {
    "@types/jsonwebtoken": "^9.0.3",
    "@types/bcryptjs": "^2.4.2",
    "better-sqlite3": "^9.0.0",
    "@types/better-sqlite3": "^7.6.4",
    "@sveltejs/adapter-cloudflare": "^4.0.0"
  }
}
```

## 環境変数設定

```env
# 開発環境 (.env)
ANTHROPIC_API_KEY=your_api_key_here
JWT_SECRET=your_jwt_secret
DATABASE_URL=./data/app.db

# 本番環境 (Cloudflare Workers)
ANTHROPIC_API_KEY=your_api_key_here
JWT_SECRET=your_jwt_secret
# D1バインディングを使用
```

## 実装順序の推奨

1. **Phase 1 (API連携)** を最初に実装し、基本的なAI会話機能を完成
2. **Phase 2 (認証)** でユーザー管理機能を追加
3. **Phase 3 (DB)** でデータ永続化を実装
4. **Phase 4 (デプロイ)** で本番環境への移行

## リスク要因と対策

### リスク
- Anthropic API の利用制限・コスト
- Cloudflare Workers の実行時間制限
- D1 データベースの制限事項

### 対策
- API使用量の監視とレート制限実装
- 長時間処理の分割
- データベース制限内での設計

## 完了目標

全Phase完了により以下が実現される：
- AIとの自然な英会話機能
- ユーザー認証とセッション管理
- チャット履歴の永続化と閲覧
- 本番環境での安定運用
- 辞書機能による学習支援

**総予想工数**: 10-15日 → **更新**: Phase 1-2完了により残り6-10日
**リリース目標**: Phase毎の段階的リリース推奨

---

## 進捗状況

### ✅ Phase 1 完了 (2025-01-22)
- Anthropic Claude APIとの完全統合
- レベル別英会話機能
- 辞書機能付きチャットインターフェース
- 実際工数: 1日（予想3-5日より短縮）

### ✅ Phase 2 完了 (2025-01-23)
- JWT認証システム実装完了
- ユーザー登録・ログイン機能
- セッション管理とトークン認証
- ルート保護機能
- 認証状態の永続化
- 実際工数: 1日（予想2-3日より短縮）

#### Phase 2 実装詳細
- **認証基盤**: JWT + bcrypt による安全な認証
- **API エンドポイント**: `/api/auth/login`, `/api/auth/register`, `/api/auth/verify`
- **セッション管理**: localStorage + サーバーサイド検証
- **ルート保護**: 全認証必須ページで自動リダイレクト
- **ユーザーデータ**: 現在は一時的（Phase 3 でデータベース連携予定）

### 🔄 次のステップ: Phase 3
データベース連携（SQLite/Cloudflare D1）の実装に進む予定

### 📊 全体進捗: 50% 完了