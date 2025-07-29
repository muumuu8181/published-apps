# 🧪 Workflow Visualizer - 包括的テストスイート

Workflow Visualizer アプリケーション用の完全自動化テストスイートです。100項目の詳細なテストケースを提供し、機能、デザイン、セキュリティ、パフォーマンスの全側面を検証します。

## 📋 目次

- [概要](#概要)
- [テストケース構成](#テストケース構成)
- [セットアップ](#セットアップ)
- [使用方法](#使用方法)
- [テストツール](#テストツール)
- [レポート](#レポート)
- [トラブルシューティング](#トラブルシューティング)

## 🎯 概要

このテストスイートは以下の特徴を持ちます：

- **100項目の包括的テストケース**
- **4つのカテゴリ**: 機能(70)、デザイン(10)、セキュリティ(10)、パフォーマンス(10)
- **完全自動化**: ブラウザ自動化によるE2Eテスト
- **詳細レポート**: HTML、JSON、CSV、Markdownレポート生成
- **モックAPIサーバー**: 独立したテスト環境

## 📊 テストケース構成

### 機能テスト (70項目)
- **基本機能 (20項目)**: ファイルアップロード、視覚化、エラー処理
- **ランダムデータ (30項目)**: 様々なデータサイズとエラー率での検証
- **エラーケース (20項目)**: 無効データ、境界値、型チェック

### デザインテスト (10項目)
- CSS プロパティの検証
- レイアウト寸法の確認
- 色、フォント、マージンの仕様準拠

### セキュリティテスト (10項目)
- XSS 攻撃防止
- 入力サニタイゼーション
- 安全でないコンテンツの検出

### パフォーマンステスト (10項目)
- 表示速度の測定
- メモリ使用量の監視
- ネットワークエラー処理

## 🚀 セットアップ

### 前提条件
- Node.js 16.0.0 以上
- npm 8.0.0 以上
- Chrome/Chromium ブラウザ

### インストール

```bash
# テストディレクトリに移動
cd workflow-visualizer-app/test

# 依存関係のインストール
npm install

# セットアップ確認
npm run setup
```

## 📖 使用方法

### 基本的なテスト実行

```bash
# 全テストの実行（推奨）
npm run test:comprehensive

# 個別テストの実行
npm run test:functional    # 機能テストのみ
npm run test:css          # CSS検証のみ
npm run test:dom          # DOM検証のみ
```

### モックサーバーの使用

```bash
# モックAPIサーバーの起動
npm run server:mock

# 別ターミナルでテスト実行
npm run test
```

### レポート生成

```bash
# 包括的レポートの生成
npm run report:generate

# レポートファイルのクリーンアップ
npm run clean
```

## 🛠️ テストツール

### 1. メインテストランナー (`run-tests.js`)
- Puppeteerベースのブラウザ自動化
- 100項目のテストケース実行
- リアルタイム結果表示

### 2. CSS検証ツール (`css-validator.js`)
- 30以上のCSS規則を検証
- 色、サイズ、レイアウトの仕様準拠チェック
- ホバー効果のテスト

### 3. DOM検証ツール (`dom-validator.js`)
- HTML構造の検証
- アクセシビリティチェック
- セマンティック要素の使用確認

### 4. 統合レポート生成 (`report-generator.js`)
- 全テストツールの結果を統合
- 複数形式でのレポート出力
- 改善推奨事項の提示

### 5. モックAPIサーバー (`mock-server.js`)
- 完全なバックエンドAPI模擬
- テストデータの自動生成
- エラーシナリオのシミュレーション

## 📊 レポート

テスト実行後、以下のレポートが生成されます：

### HTMLレポート
- `comprehensive-test-report.html`: 総合結果（推奨）
- `test-report.html`: 機能テスト結果
- `css-validation-report.html`: CSS検証結果
- `dom-validation-report.html`: DOM検証結果

### データファイル
- `comprehensive-test-report.json`: 完全なテストデータ
- `test-results.json`: 機能テスト詳細
- `comprehensive-test-report.csv`: CSV形式の結果
- `comprehensive-test-report.md`: Markdown形式の要約

## 🔧 設定

### テスト設定の変更

`package.json` の `testConfig` セクションで設定を変更できます：

```json
{
  "testConfig": {
    "browser": {
      "headless": false,        // ブラウザ表示/非表示
      "viewport": {
        "width": 1280,
        "height": 720
      },
      "timeout": 30000          // タイムアウト(ms)
    }
  }
}
```

### 個別テストの無効化

`test-cases.json` でテストケースの `priority` を `"skip"` に設定：

```json
{
  "id": 10,
  "priority": "skip",
  "description": "このテストをスキップ"
}
```

## 🚨 トラブルシューティング

### よくある問題

#### 1. Puppeteerのインストールエラー
```bash
# Chromiumの手動ダウンロード
npx puppeteer browsers install chrome
```

#### 2. ポート競合エラー
```bash
# 異なるポートでモックサーバーを起動
PORT=3002 npm run server:mock
```

#### 3. テストタイムアウト
```bash
# タイムアウト値を増加
TIMEOUT=60000 npm run test
```

#### 4. メモリ不足
```bash
# Node.jsメモリ制限を増加
node --max-old-space-size=4096 run-tests.js
```

### デバッグモード

```bash
# デバッグ情報を有効化
DEBUG=true npm run test

# ブラウザを表示してテスト実行
HEADLESS=false npm run test
```

## 📝 テストケース詳細

### 詳細指定済み20項目

1. **Upload log with 18 steps** → Timeline displayed
2. **Invalid JSON** → "Invalid: Malformed"
3. **Visualize errors at [3,8,15]** → Highlighted in chart
4. **Add resolution to step 3** → Insight saved
5. **Export after analysis** → JSON with insights
6. **51 steps log** → "Limit exceeded"
7. **Animation on error hover** → Fade effect
8. **Empty log** → "Invalid: No data"
9. **Filter by error steps** → Only errors shown
10. **Summary total time 30min** → Correct display
11. **XSS Prevention** → "Invalid: Unsafe"
12. **Visualize trials as bubbles** → Size based on trials
13. **Export empty insights** → Empty JSON
14. **Multiple uploads** → Overwrite data
15. **Animation transition** → Smooth workflow flow
16. **Unicode description** → Success display
17. **High trials (10) visualization** → Large bubble
18. **Resolution edit** → Updated insight
19. **Quick visualize (1s)** → Instant render
20. **Log all operations** → Console has logs

### 追加80項目

- **21-50**: ランダムデータ処理（様々なサイズとエラー率）
- **51-80**: エラーケース（無効データ、境界値、型チェック）
- **81-100**: 複数操作連鎖、パフォーマンス、セキュリティテスト

## 🤝 貢献

新しいテストケースの追加や改善提案は歓迎します：

1. `test-cases.json` に新しいテストケースを追加
2. 該当するテストツールにロジックを実装
3. テストを実行して動作確認

## 📄 ライセンス

MIT License - 詳細は [LICENSE](../LICENSE) を参照

## 🔗 関連リンク

- [Workflow Visualizer App](../src/index.html)
- [Puppeteer Documentation](https://pptr.dev/)
- [Express.js Documentation](https://expressjs.com/)

---

## 🎯 クイックスタートガイド

```bash
# 1. 依存関係のインストール
npm install

# 2. モックサーバーの起動（新しいターミナル）
npm run server:mock

# 3. 包括的テストの実行
npm run test:comprehensive

# 4. レポートの確認
open comprehensive-test-report.html
```

このテストスイートにより、Workflow Visualizer アプリケーションの品質と信頼性を包括的に検証できます。