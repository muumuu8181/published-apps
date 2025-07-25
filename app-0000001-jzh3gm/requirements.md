# 要件・仕様書: お金管理システム

## 元要求
- 収入と支出を入力できること
- 入力された値は後から編集できること
- CSVとしてデータをDLできること

## 解釈した仕様
### 基本機能
1. **収支入力機能**
   - 収入/支出の種別選択
   - 金額入力（数値のみ、正の値）
   - カテゴリー入力（自由記述、自動補完付き）
   - 日付選択
   - メモ入力（任意）

2. **編集機能**
   - 記録一覧から任意のレコードを選択して編集
   - 編集時は元のデータをフォームに自動入力
   - 更新/キャンセルが可能

3. **CSVエクスポート機能**
   - 全データをCSV形式でダウンロード
   - 日本語対応（UTF-8 BOM付き）
   - ヘッダー行付き

### 追加実装機能
1. **統計・分析機能**
   - 収入/支出/残高の自動集計
   - 貯蓄率の計算と表示
   - カテゴリー別統計
   - 月別推移表示

2. **目標管理機能**
   - 月間貯蓄目標の設定
   - 進捗バーによる視覚的表示
   - 達成率の計算

3. **フィルタリング・検索機能**
   - カテゴリー/メモでの検索
   - 収入/支出での絞り込み
   - 月別フィルター

4. **データ永続化**
   - LocalStorageによる自動保存
   - 旧バージョンからのデータ移行

5. **UI/UX強化**
   - レスポンシブデザイン
   - タブによる機能分離
   - トースト通知
   - キーボードショートカット

6. **PWA対応**
   - オフライン動作
   - アプリとしてインストール可能

## 技術的制約・判断
### 選択した技術スタック
- **フロントエンド**: 純粋なHTML/CSS/JavaScript
  - 理由: 外部依存なしで高速動作、単一ファイルで完結
- **データストレージ**: LocalStorage
  - 理由: シンプルで十分な容量、同期的API
- **スタイリング**: CSS Variables + Flexbox/Grid
  - 理由: モダンなレイアウト、テーマ変更の容易さ

### 設計判断
1. **単一HTMLファイル構成**
   - メリット: デプロイが簡単、初期ロード高速
   - デメリット: ファイルサイズが大きくなる可能性

2. **クラスベースアーキテクチャ**
   - メリット: 状態管理が明確、拡張性が高い
   - デメリット: 初期実装がやや複雑

3. **インラインService Worker**
   - メリット: 外部ファイル不要
   - デメリット: 機能が限定的

## 変更履歴
- 2025-07-26: 初回作成（v7.0）
  - 基本的な収支管理機能
  - 編集・削除機能
  - CSVエクスポート
  - 統計・分析機能
  - PWA対応