# JibunKaigi test

じぶん会議の軽量UI実験版です。

このリポジトリは、本流のじぶん会議とは別に、UI/UX・スマホ体験・入口体験を磨くための実験用リポジトリとして扱います。

## 位置づけ

- 本流のじぶん会議とは別管理の実験版
- 静的HTML/CSS/JavaScript構成を活かした軽量PWA版
- 深層ロジックよりも、触り心地・見やすさ・スマホ体験を優先
- 将来、別UI版・軽量版・プロトタイプ版として再利用できる状態を目指す

## 開発方針

このリポジトリでは、まずUIを大幅に強化します。

優先すること:

1. スマホでアプリらしく見えること
2. 初めて触る人が迷わないこと
3. エージェントの違いが直感的に伝わること
4. ただのチャットではなく「内面の会議」に見えること
5. 既存の会話ロジックを壊さず、段階的に改善すること

## 現在のUI強化状況

- Phase 0: UI方針と安全ルールを整理
- Phase 1: スプラッシュ、背景、空チャット、入力欄の見た目を強化
- Phase 2: エージェントバーを声のデッキ化し、`委ねる` と現在の声ステータスを追加
- Phase 3: 会議録、会議メモ風の返信、星座風の関係性マップを追加
- Phase 4: Cloudflare Pages 手動デプロイ手順を整理

## デプロイ方針

Vercelは使いません。

必要に応じて、Cloudflare Pages に手動デプロイします。

Cloudflare Pages の詳しい手順は以下にまとめています。

- [`docs/cloudflare-manual-deploy.md`](docs/cloudflare-manual-deploy.md)

このリポジトリは静的サイト構成のため、Cloudflare Pages では基本的に以下の方針で扱います。

- Framework preset: `None`
- Build command: 空欄、または不要
- Build output directory: `/` またはプロジェクトルート
- Environment variables: Phase 4時点では不要
- API key / token / secret は絶対にコードへ書かない

## 触ってよい範囲

UI改善では、主に以下を触ります。

- `index.html`
- `css/`
- `js/ui.js` の表示まわり
- 追加のPhase別UI補助JS
- `README.md`
- `docs/`

## 触らない範囲

安全なUI改善Phaseでは以下を触りません。

- `js/chat.js` の会話生成ロジック
- `js/agents.js` の思想・人格定義の大幅変更
- `js/modes.js` の応答モードロジック
- 外部API接続
- 認証
- DB接続
- 課金
- 本番データ削除
- セキュリティルール変更

## 手動ゲート

以下は必ず手動確認を挟みます。

- Cloudflare Pages の本番公開判断
- 独自ドメイン接続
- API key / token / secret の作成や登録
- 認証・DB・課金まわりの導入
- 中核思想やエージェント性格に関わる大きな変更
- 大規模リファクタ

## 設計ドキュメント

- [`docs/ui-redesign-plan.md`](docs/ui-redesign-plan.md)
- [`docs/cloudflare-manual-deploy.md`](docs/cloudflare-manual-deploy.md)
