# UIパーソナライズ評価用アプリケーション

Next.jsを用いた動的JSX生成によるUIパーソナライズがユーザーエクスペリエンスに与える影響を評価するための実験用ウェブアプリケーションです。

## 機能

- 事前アンケートによるユーザー特性の収集
- Gemini APIを使用したUI構成の動的生成
- プロジェクトダッシュボードの表示
- プロフィール設定画面でのユーザー名変更タスク
- 事後アンケートによる主観評価の収集
- 実験データの自動収集とCSVエクスポート
- 実験群/統制群の切り替え機能

## セットアップ

### 1. 依存関係のインストール

```bash
pnpm install
```

### 2. 環境変数の設定

`.env.local`ファイルを作成し、以下の環境変数を設定してください：

```env
# Gemini APIキー
NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key_here

# 実験モード (experimental または control)
NEXT_PUBLIC_EXPERIMENT_MODE=experimental
```

### 3. 開発サーバーの起動

```bash
pnpm dev
```

## 使用方法

### 実験群モード (experimental)

```bash
# 環境変数で設定
NEXT_PUBLIC_EXPERIMENT_MODE=experimental

# またはURLパラメータで設定
http://localhost:3000?mode=experimental
```

### 統制群モード (control)

```bash
# 環境変数で設定
NEXT_PUBLIC_EXPERIMENT_MODE=control

# またはURLパラメータで設定
http://localhost:3000?mode=control
```

## アーキテクチャ

### コンポーネント構成

- `PreSurveyModal`: 事前アンケートモーダル
- `Dashboard`: プロジェクトダッシュボード画面
- `ProfileSettings`: プロフィール設定画面
- `PostSurveyModal`: 事後アンケートモーダル

### 主要ファイル

- `src/types/index.ts`: TypeScript型定義
- `src/hooks/useExperimentData.ts`: 実験データ管理フック
- `src/lib/gemini.ts`: Gemini API連携
- `src/lib/experimentMode.ts`: 実験モード管理
- `src/config/personalization.json`: パーソナライズ設定

## 実験フロー

1. 実験者が実験群/統制群を設定
2. 参加者がアプリケーションにアクセス
3. 実験群・統制群に関わらず事前アンケートを実施
4. 実験群：Gemini APIでUI構成を決定、統制群：標準スタイルを使用
5. プロジェクトダッシュボードを表示
6. プロフィール設定画面でユーザー名変更タスクを実行
7. 事後アンケートを実施
8. 実験データをCSVファイルとしてダウンロード

## データ収集

以下のデータが自動的に収集されます：

- 参加者ID
- 実験群/統制群の区別
- 適用されたUI構成
- 事前アンケートの回答
- 各画面での滞在時間
- タスク完了時間
- 総クリック数
- タスク成功/失敗
- 事後アンケートの回答

## 技術仕様

- **フレームワーク**: Next.js 15
- **言語**: TypeScript
- **スタイリング**: Tailwind CSS
- **UIライブラリ**: GitHub Primer
- **API**: Gemini API
- **パッケージマネージャー**: pnpm

## 開発者向け情報

### デバッグ情報

開発モードでは、画面右下にデバッグ情報が表示されます：

- 実験モード
- 参加者ID
- 現在のクリック数

### カスタマイズ

パーソナライズ設定は `src/config/personalization.json` で変更できます。各スタイルバリエーション（standard, novice, expert）のTailwind CSSクラスを定義しています。

## ライセンス

MIT License
