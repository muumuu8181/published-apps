# 要件・仕様書: お金管理システム v2.0

## 元要求
- 収入と支出を入力できること
- 入力された値は後から編集できること
- CSVとしてデータをDLできること

## 解釈した仕様
### 基本機能
1. **データ入力機能**
   - 日付、種別（収入/支出）、カテゴリ、金額、メモの入力
   - フォームバリデーション（必須項目チェック）
   - 今日の日付を初期値として設定
   - カテゴリの自動補完機能

2. **データ管理機能**
   - 入力データの一覧表示
   - フィルタリング機能（すべて/収入のみ/支出のみ）
   - ソート機能（日付・金額の昇順/降順）
   - 各データの編集機能（モーダルダイアログ）
   - 各データの削除機能（確認ダイアログ付き）
   - LocalStorageによるデータ永続化

3. **サマリー表示機能**
   - 総収入の自動計算・表示
   - 総支出の自動計算・表示
   - 収支バランスの自動計算・表示
   - 視覚的なカード型UI（グラデーション効果）

4. **エクスポート機能**
   - CSV形式でのダウンロード
   - Excel対応（BOM付きUTF-8）
   - 日付順でのソート済みデータ

5. **拡張機能（v2.0新機能）**
   - PWA対応（オフライン動作可能）
   - レスポンシブデザイン（モバイル最適化）
   - アニメーション効果
   - 通知システム

## 技術的制約・判断
### 選択した技術
- **フロントエンドのみ**: サーバー不要でどこでも動作
- **LocalStorage**: ブラウザ内でのデータ永続化
- **ES6+ JavaScript**: モダンな構文とクラスベース設計
- **CSS変数**: テーマ管理とカスタマイズ性
- **PWA**: プログレッシブウェブアプリ対応

### 技術的判断
- データベース不使用: 個人利用を想定し、LocalStorageで十分と判断
- フレームワーク不使用: シンプルな機能のため、バニラJSで実装
- BOM付きCSV: 日本語環境でのExcel互換性を重視
- クラス構文採用: コードの保守性と拡張性を考慮

### アーキテクチャ設計
- **MoneyManagerクラス**: 中央集権的なデータ管理
- **イベント駆動型**: ユーザー操作に即座に反応
- **関心の分離**: HTML（構造）、CSS（装飾）、JS（動作）を明確に分離

## 変更履歴
- 2025-07-26T12:33:00+09:00: 初回作成（v2.0）