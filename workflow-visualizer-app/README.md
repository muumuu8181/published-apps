# WorkflowVisualizerApp

ワークフローログの視覚化、エラー箇所分析、インサイト抽出を行うWebアプリケーション。Node.js + Express + Chart.jsによる動的なワークフロー可視化システム。

## プロジェクト概要

**アプリ名**: WorkflowVisualizerApp  
**目的**: ワークフローログ視覚化、エラー箇所分析、インサイト抽出  
**技術スタック**: Node.js, Express, Chart.js  
**アニメーション**: CSSアニメーション、楽しい視覚化  

### 主要機能
- JSONログファイルのアップロードと解析
- Chart.jsによるタイムライン視覚化
- エラー箇所の赤色強調表示
- 試行回数のバブル表示
- インサイトの追加・編集・エクスポート
- XSS防止セキュリティ機能
- レスポンシブデザイン

## 起動方法

### 前提条件
- Node.js 16.0.0以上
- npm 8.0.0以上

### セットアップと起動

```bash
# リポジトリのクローン
git clone <repository-url>
cd workflow-visualizer-app

# 依存関係インストール
npm install

# サーバー起動
npm start
# または
node app.js

# ブラウザアクセス
http://localhost:3000
```

### 開発環境での起動

```bash
# 開発モードで起動
npm run dev
```

## APIエンドポイント仕様

### 1. ログデータアップロード
```http
POST /upload
Content-Type: application/json

{
  "logData": [
    {
      "stepId": 1,
      "description": "Setup project",
      "timeSpent": 5,
      "error": false,
      "errorTime": 0,
      "trials": 1,
      "resolution": ""
    }
  ]
}
```

**レスポンス**: アップロード成功時、計算されたインサイトを返却

### 2. インサイト取得
```http
GET /insights
```

**レスポンス**: 現在のワークフローインサイトデータ

### 3. 解決策追加
```http
POST /add-resolution
Content-Type: application/json

{
  "stepId": 1,
  "resolution": "解決方法の説明"
}
```

**レスポンス**: 更新されたインサイトデータ

### 4. JSONエクスポート
```http
GET /download
```

**レスポンス**: workflow_insights.jsonファイルのダウンロード

### 5. ヘルスチェック
```http
GET /health
```

**レスポンス**: サーバーの稼働状況

## 使用方法

### 基本的なワークフロー

1. **データ入力**
   - JSONファイルをアップロード、または
   - テキストエリアに直接JSON入力

2. **視覚化実行**
   - Visualizeボタンをクリック
   - Chart.jsによるタイムライン表示

3. **インサイト確認**
   - 総ステップ数、総時間、エラー率の確認
   - エラー箇所の赤色強調表示

4. **解決策追加**
   - エラーステップに解決策を追加
   - インサイトの更新

5. **データエクスポート**
   - Export InsightsボタンでJSON出力

### データ形式

```json
[
  {
    "stepId": 1,
    "description": "プロジェクトセットアップ",
    "timeSpent": 5,
    "error": false,
    "errorTime": 0,
    "trials": 1,
    "resolution": ""
  },
  {
    "stepId": 2,
    "description": "依存関係インストール",
    "timeSpent": 3,
    "error": true,
    "errorTime": 10,
    "trials": 3,
    "resolution": "npm cache cleanで解決"
  }
]
```

### データ制限
- 最大50ステップまで
- ファイルサイズ制限: 10MB
- 必須フィールド: stepId, description, timeSpent, error, errorTime, trials

## テスト手順

### テスト環境セットアップ

```bash
# テストディレクトリに移動
cd test

# テスト依存関係インストール
npm install

# セットアップ確認
npm run setup
```

### 包括的テスト実行

```bash
# 100項目テスト実行
npm run test:comprehensive

# 個別テスト実行
npm run test:functional    # 機能テストのみ
npm run test:css          # CSS検証のみ
npm run test:dom          # DOM検証のみ
```

### モックサーバー使用

```bash
# モックAPIサーバーの起動
npm run server:mock

# 別ターミナルでテスト実行
npm run test
```

### レポート生成と確認

```bash
# レポート生成
npm run report:generate

# HTMLレポート確認
open comprehensive-test-report.html
```

**生成されるレポート**:
- `comprehensive-test-report.html`: 総合結果
- `test-results.json`: 詳細データ
- `comprehensive-test-report.csv`: CSV形式
- `comprehensive-test-report.md`: Markdown要約

### テスト項目構成
- **機能テスト**: 70項目（基本機能、ランダムデータ、エラーケース）
- **デザインテスト**: 10項目（CSS、レイアウト検証）
- **セキュリティテスト**: 10項目（XSS防止、入力サニタイゼーション）
- **パフォーマンステスト**: 10項目（表示速度、メモリ使用量）

## GitHub Pages公開手順

### 1. gh-pagesパッケージ追加

```bash
# gh-pagesインストール
npm install --save-dev gh-pages
```

### 2. package.jsonに公開スクリプト追加

```json
{
  "scripts": {
    "predeploy": "npm run build",
    "deploy": "gh-pages -d src/",
    "build": "echo 'Build completed'"
  },
  "homepage": "https://muumuu8181.github.io/published-apps/workflow-visualizer-app/"
}
```

### 3. デプロイ実行

```bash
# ビルド（必要に応じて）
npm run build

# GitHub Pagesにデプロイ
npm run deploy

# または手動デプロイ
gh-pages -d src/
```

### 4. リポジトリ設定

1. GitHubリポジトリのSettings → Pages
2. Source: Deploy from a branch
3. Branch: gh-pages / root
4. Save

### 5. 公開URL（予定）
`https://muumuu8181.github.io/published-apps/workflow-visualizer-app/`

## フォルダ構成

```
workflow-visualizer-app/
├── package.json              # プロジェクト設定とスクリプト
├── app.js                    # Express サーバー（APIエンドポイント）
├── README.md                 # このファイル
├── src/                      # フロントエンド資産
│   ├── index.html           # メインHTML
│   ├── styles.css           # CSSスタイル
│   └── script.js            # JavaScript（Chart.js処理）
├── test/                     # 100項目テストスイート
│   ├── package.json         # テスト依存関係
│   ├── run-all-tests.sh     # テスト実行シェル
│   ├── run-tests.js         # メインテストランナー
│   ├── css-validator.js     # CSS検証ツール
│   ├── dom-validator.js     # DOM検証ツール
│   ├── mock-server.js       # モックAPIサーバー
│   ├── report-generator.js  # レポート生成ツール
│   ├── test-cases.json      # テストケース定義
│   ├── README.md            # テスト詳細ドキュメント
│   └── OVERVIEW.md          # テスト概要
└── docs/                     # ドキュメント（将来使用）
```

## 機能紹介

### Chart.jsタイムライン視覚化
- ステップごとの時間消費をバー形式で表示
- エラーステップの赤色強調（#FF0000）
- 試行回数のバブルサイズ表示
- スムーズなフェードイン/アウトアニメーション

### インタラクティブ機能
- ホバー時のツールチップ表示
- エラー箇所クリックで詳細情報
- リアルタイムインサイト更新
- JSONデータのリアルタイム検証

### セキュリティ機能
- XSS攻撃防止（スクリプトタグ除去）
- 入力データのサニタイゼーション
- HTMLエスケープ処理
- 安全でないコンテンツの検出・除去

### レスポンシブデザイン
- 左右分割レイアウト（40%:60%）
- モバイルデバイス対応
- 動的コンテンツサイズ調整

## デザイン仕様

### レイアウト設計
- **左側パネル（40%）**: データ入力、インサイト表示
- **右側パネル（60%）**: Chart.js視覚化エリア
- **ボタンサイズ**: 80px × 40px
- **マージン**: 統一された8pxマージン

### カラーパレット
- **プライマリボタン**: #4CAF50（緑）
- **エラー表示**: #FF0000（赤）
- **背景色**: #f4f4f4（ライトグレー）
- **テキスト**: #333333（ダークグレー）

### フォント設定
- **リストテキスト**: 16px
- **ラベルテキスト**: 24px
- **フォントファミリー**: Arial, sans-serif

### アニメーション効果
- **フェードイン**: 0.3秒のイージング
- **ホバーエフェクト**: 0.2秒のスケール変換
- **チャート描画**: 1秒のプログレッシブ表示

## トラブルシューティング

### よくある問題

#### 1. ポート3000使用中エラー
```bash
# 使用中のプロセス確認
lsof -i :3000

# プロセス終了
kill -9 <PID>

# または別ポートで起動
PORT=3001 node app.js
```

#### 2. Chart.js読み込みエラー
- CDNからの読み込み確認: `https://cdn.jsdelivr.net/npm/chart.js`
- ネットワーク接続の確認
- ブラウザキャッシュのクリア

#### 3. JSONフォーマットエラー
```javascript
// 有効なJSON形式例
[
  {
    "stepId": 1,          // number型必須
    "description": "text", // string型必須
    "timeSpent": 5,       // number型必須
    "error": false,       // boolean型必須
    "errorTime": 0,       // number型必須
    "trials": 1           // number型必須
  }
]
```

#### 4. アニメーション動作不良
- ブラウザの開発者ツールでCSS確認
- `animation-duration`プロパティの検証
- JavaScriptエラーのコンソール確認

#### 5. テスト実行エラー
```bash
# Puppeteer関連エラー
npx puppeteer browsers install chrome

# 権限エラー（Linux/Mac）
chmod +x test/run-all-tests.sh

# Node.jsメモリ不足
node --max-old-space-size=4096 test/run-tests.js
```

### デバッグ方法

#### サーバーログの確認
```bash
# 詳細ログ出力
DEBUG=true node app.js

# 操作ログの監視
tail -f server.log
```

#### ブラウザ開発者ツール
1. F12で開発者ツール起動
2. Consoleタブでエラー確認
3. Networkタブで通信状況確認
4. Elementsタブで DOM構造確認

### パフォーマンス最適化

#### メモリ使用量監視
```javascript
// app.jsに追加
process.on('SIGINT', () => {
  console.log('Memory usage:', process.memoryUsage());
});
```

#### ファイルサイズ制限
- JSONファイル: 10MB以下
- ステップ数: 50以下
- 大容量データは分割処理推奨

## 技術仕様

### 対応ブラウザ
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

### Node.js要件
- Node.js 16.0.0以上
- npm 8.0.0以上
- Express 4.18.0以上

### セキュリティ設定
- Content Security Policy（CSP）対応
- CORS設定済み
- 入力値サニタイゼーション
- SQLインジェクション対策（該当なし）

## 更新履歴

### v1.0.0（2025-01-29）
- 初回リリース
- 基本機能実装完了
- 100項目テストスイート追加
- GitHub Pages対応

---

## ライセンス

MIT License

## 貢献

プルリクエストと Issue報告を歓迎します。

1. リポジトリをフォーク
2. 機能ブランチを作成（`git checkout -b feature/new-feature`）
3. 変更をコミット（`git commit -am 'Add new feature'`）
4. ブランチにプッシュ（`git push origin feature/new-feature`）
5. プルリクエストを作成

## サポート

技術的な質問やバグ報告は GitHub Issues で受け付けています。

**GitHub Repository**: `https://github.com/muumuu8181/workflow-visualizer-app`