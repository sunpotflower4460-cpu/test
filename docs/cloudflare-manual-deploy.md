# Cloudflare Pages 手動デプロイ手順

この文書は、じぶん会議 test版を Cloudflare Pages で手動デプロイするためのメモです。

このリポジトリは静的HTML/CSS/JavaScript構成です。ViteやNext.jsのビルドは使っていません。

## 0. 方針

- Vercelは使わない
- Cloudflare Pagesで必要に応じて手動デプロイする
- API key / token / secret はコードに書かない
- Phase 4時点では環境変数は不要
- 本番公開の最終判断は必ず手動で行う

## 1. Cloudflare Pages の設定値

Cloudflare Pagesでプロジェクトを作るときは、基本的に以下を使います。

```text
Framework preset: None
Build command: 空欄
Build output directory: /
Root directory: /
Environment variables: なし
```

Cloudflareの画面によって `/` が指定できない場合は、空欄またはプロジェクトルート相当の設定にします。

## 2. GitHub 連携で作る場合

1. Cloudflare Dashboard を開く
2. Workers & Pages を開く
3. Create application を押す
4. Pages を選ぶ
5. Connect to Git を選ぶ
6. GitHub連携で `sunpotflower4460-cpu/test` を選ぶ
7. Production branch を `main` にする
8. Framework preset を `None` にする
9. Build command は空欄にする
10. Build output directory は `/` にする
11. Save and Deploy を押す

## 3. 手動アップロードで作る場合

GitHub連携ではなく、ファイルを直接アップロードする場合の流れです。

1. GitHubのリポジトリを開く
2. Code → Download ZIP を押す
3. ZIPを解凍する
4. 中にある以下を含むフォルダを確認する

```text
index.html
manifest.json
css/
js/
icons/
```

5. Cloudflare Pages の Direct Upload を開く
6. 解凍したフォルダの中身をアップロードする
7. デプロイ完了後、表示URLを開く

## 4. 公開前チェック

公開前に最低限ここを確認します。

- スプラッシュ画面が表示される
- 「はじめる」を押してメイン画面へ入れる
- 入力欄に文字を入れて送信できる
- エージェントを選択できる
- `委ねる` カードが表示される
- 会議録サイドバーを開ける
- 関係マップを開ける
- スマホ幅で下部入力欄が隠れない
- ダーク/ライト切替ができる

## 5. このリポジトリでやらないこと

Phase 4時点では以下はやりません。

- API接続
- 認証
- DB接続
- 課金
- 本番データ操作
- Cloudflare Workersの追加
- Cloudflare Secretsの登録

## 6. もし表示されない場合

### index.html が見つからない場合

Build output directory が違う可能性があります。

このリポジトリでは `index.html` がルートにあるため、出力先は `/` またはルート相当です。

### CSSやJSが反映されない場合

以下のフォルダが一緒にアップロードされているか確認します。

```text
css/
js/
```

### 古い表示のままの場合

ブラウザキャッシュの可能性があります。

- Safari / Chromeで再読み込みする
- Cloudflare Pages側で再デプロイする
- 必要ならキャッシュを消して確認する

## 7. 手動ゲート

以下は勝手に進めず、必ず手動確認を挟みます。

- Cloudflare Pagesの本番公開判断
- 独自ドメイン接続
- 環境変数追加
- API key / token / secret 登録
- 認証やDBの導入
- Cloudflare Workers追加

## 8. Phase 4完了条件

- READMEからこの手順書へ辿れる
- Cloudflare Pagesの設定値が明記されている
- GitHub連携とDirect Uploadの両方の手順がある
- 公開前チェック項目がある
- secretをコードに書かない方針が明記されている
