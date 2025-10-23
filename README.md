# ベイスターズ自動情報サイト

横浜DeNAベイスターズの最新情報を毎日自動で収集し、AI（Gemini）で記事を生成して公開する完全自動化ニュースサイトです。

## 特徴

- **自動記事生成**: GitHub Actionsで毎日夜間に自動実行
- **複数ソース対応**: ベイスターズ公式サイト、Yahoo!ニュース、毎日新聞など複数のソースから情報収集
- **AI記事作成**: Google Gemini APIを使用してニュースから記事を自動生成
- **モバイル対応**: ベイスターズの青を基調としたレスポンシブデザイン
- **GitHub Pages公開**: 静的サイトとしてGitHub Pagesで公開

## プロジェクト構成

```
baystars-news-site/
├── .github/
│   └── workflows/
│       └── auto-generate.yml      # GitHub Actions ワークフロー
├── articles/                       # 生成された記事（Markdown）
├── posts/                          # 記事メタデータ
├── src/
│   ├── index.html                 # メインページ
│   ├── styles/                    # CSS
│   └── js/                        # JavaScript
├── scripts/
│   ├── fetch-articles.js          # 記事収集スクリプト
│   ├── generate-articles.js       # AI記事生成スクリプト
│   └── build-site.js              # サイトビルドスクリプト
├── public/                         # 静的ファイル
└── docs/                          # ドキュメント
```

## セットアップ

### 1. 必要な認証情報

- **Gemini API Key**: https://ai.google.dev から取得
- **GitHub Token**: リポジトリへの書き込み権限が必要

### 2. インストール

```bash
npm install
```

### 3. 環境変数の設定

`.env.example` をコピーして `.env` を作成し、必要な値を設定します。

```bash
cp .env.example .env
```

### 4. 手動実行（テスト）

```bash
npm start
```

## GitHub Actions設定

`.github/workflows/auto-generate.yml` で以下の処理を毎日夜間に自動実行します:

1. 複数のソースから最新のベイスターズ情報を収集
2. Gemini APIで記事を自動生成
3. Markdownファイルとして保存
4. サイトを再ビルド
5. GitHub Pagesにデプロイ

## 記事の構成

各記事は以下のフロントマターを含むMarkdownファイルとして保存されます:

```markdown
---
title: "記事のタイトル"
date: "2025-10-23"
category: "選手・チーム"
source: "baystars"
author: "AI記事生成"
---

記事の本文...
```

## サイトデザイン

- **メインカラー**: ベイスターズブルー (#003DA5)
- **アクセントカラー**: ゴールド (#FFD700)
- **レイアウト**: モバイルファースト、レスポンシブ対応

## ライセンス

MIT

## 注意事項

- このプロジェクトは自動化を目的としており、著作権に配慮した運用をしてください
- 記事の引用元は明記されます
- API利用制限に注意してください

