# じぶん会議 test版 Design System Plan

## 0. この文書の目的

この文書は、Phase 6Bとして「世界クオリティ化」のためのUI基盤を固定する設計書です。

Phase 0〜5では、段階的にUIを強化してきました。Phase 6Bでは、増えてきたCSSやUI表現をバラバラにせず、今後の磨き込みに使える共通ルールへ整理します。

この段階では、大規模リファクタは行いません。既存の見た目を壊さず、上から効くトークンと共通部品ルールを追加します。

## 1. 目的

Phase 6Bの目的は以下です。

- UI全体の統一感を上げる
- 余白、角丸、影、境界線、モーションの基準を作る
- 各Phaseの追加CSSが今後暴れないようにする
- Phase 6Cのエージェント人格UI化の土台を作る
- 世界クオリティ化のための「共通語彙」をコードに持たせる

## 2. 方針

### 2.1 既存を壊さない

Phase 6Bでは、既存の `style.css` やPhase別CSSを削除・統合しません。

代わりに、以下を追加します。

- `docs/design-system-plan.md`
- `css/phase6b-design-system.css`

`phase6b-design-system.css` は最後に読み込み、既存UIに共通トークンと軽い補正を与えます。

### 2.2 世界観と実用性を両立する

美しさのために読みづらくしません。
使いやすさのために世界観を捨てません。

判断順は以下です。

1. 使いやすさ
2. 読みやすさ
3. じぶん会議らしさ
4. 美しさ
5. 実装の安全性
6. 将来の拡張性

### 2.3 今後の追加CSSはトークンを使う

新しいUI改善は、できるだけ以下のトークンを使います。

- spacing
- radius
- shadow
- border
- motion
- text scale
- surface layers
- agent accent

## 3. Design Tokens

### 3.1 Spacing

| Token | Value | Use |
|---|---:|---|
| `--space-1` | 4px | 微細な隙間 |
| `--space-2` | 8px | 小要素間 |
| `--space-3` | 12px | ボタン内余白 |
| `--space-4` | 16px | 標準余白 |
| `--space-5` | 20px | カード内余白 |
| `--space-6` | 24px | セクション余白 |
| `--space-8` | 32px | 大きな呼吸 |
| `--space-10` | 40px | 画面単位の余白 |
| `--space-12` | 48px | 大きな画面間隔 |

### 3.2 Radius

| Token | Value | Use |
|---|---:|---|
| `--radius-xs` | 10px | 小ボタン |
| `--radius-sm` | 14px | 小カード |
| `--radius-md` | 18px | 標準カード |
| `--radius-lg` | 24px | 入力欄・大ボタン |
| `--radius-xl` | 30px | モーダル・大カード |
| `--radius-2xl` | 36px | 世界観を持つ器 |
| `--radius-full` | 999px | 丸・ピル |

### 3.3 Surface

| Token | Use |
|---|---|
| `--surface-glass` | 薄いガラス面 |
| `--surface-glass-strong` | 読ませるガラス面 |
| `--surface-card` | 標準カード |
| `--surface-floating` | 浮いている面 |
| `--surface-soft` | 補助面 |

### 3.4 Border

| Token | Use |
|---|---|
| `--border-soft` | 薄い境界 |
| `--border-medium` | 標準境界 |
| `--border-accent-soft` | 選択時の淡い境界 |
| `--border-danger-soft` | 削除などの注意境界 |

### 3.5 Shadow

| Token | Use |
|---|---|
| `--shadow-soft` | 軽いカード |
| `--shadow-card` | 標準カード |
| `--shadow-floating` | モーダル/入力欄 |
| `--shadow-glow` | 選択中の光 |
| `--inner-highlight` | 上面の微光 |

### 3.6 Motion

| Token | Value | Use |
|---|---:|---|
| `--motion-fast` | 140ms | tap/hover |
| `--motion-normal` | 220ms | 選択/小遷移 |
| `--motion-slow` | 340ms | モーダル/サイドバー |
| `--motion-entrance` | 720ms | スプラッシュ/入口 |
| `--ease-out-soft` | cubic-bezier | 柔らかい終了 |
| `--ease-spring-soft` | cubic-bezier | 少し浮く選択 |

## 4. Component Rules

### 4.1 App Shell

- 背景は深く、主UIは浮かせる
- 重要な操作は下部に置く
- 装飾は本文の邪魔をしない

### 4.2 Header

- 高さを詰めすぎない
- 会議名は省略表示できるようにする
- ボタンは44px前後のタップ領域を確保する

### 4.3 Welcome Panel

- 初見の不安を消す
- 提案ボタンは短く自然な言葉にする
- 画面中央に圧迫感を出しすぎない

### 4.4 Agent Deck

- 選択中の声は明確にする
- ただし派手に跳ねすぎない
- 横スクロールの指触りを重視する
- 文字が潰れる場合は説明を減らす

### 4.5 Agent Status

- 現在の声を最短で伝える
- エージェント別の文言差はPhase 6Cで入れる
- 未選択状態も不安にしない

### 4.6 Chat Bubble

- 長文で読める行間を優先
- エージェント返信は会議メモの雰囲気を持つ
- ユーザー発言とエージェント発言の差を明確にする

### 4.7 Input Composer

- 常に主役
- キーボード表示時に崩れにくい
- 送信可能/不可が見た目で分かる
- placeholderは柔らかく、迷いを減らす

### 4.8 Modal

- 下から出るモーダルはスマホで扱いやすくする
- 長文はスクロールできる
- 閉じる操作が分かりやすい

### 4.9 Toast

- ささやかに伝える
- 邪魔しない
- 画面端にはみ出さない

## 5. Phase 6B実装範囲

### やること

- `css/phase6b-design-system.css` を追加
- design tokenを追加
- 既存UIに軽い統一補正をかける
- READMEに設計書を追加
- 次のPhase 6Cへ渡す土台を作る

### やらないこと

- 既存CSSの削除
- 既存CSSの大規模統合
- HTML構造の大変更
- 会話生成ロジック変更
- エージェント定義変更
- 認証/DB/API追加
- 本流じぶん会議との統合

## 6. Phase 6Cへの引き継ぎ

Phase 6Cでは、エージェントごとのUI人格をより強くします。

6Bで追加したトークンを使い、以下を磨きます。

- AgentDeckの個性
- AgentStatus文言と光
- PersonaModalの見え方
- ChatBubbleのエージェント別アクセント
- `委ねる` の場としての表現

## 7. 完了条件

Phase 6Bの完了条件:

- 共通トークンが定義されている
- 主要コンポーネントに統一補正が入っている
- 既存機能が壊れていない
- 既存CSSを無理に削除していない
- Phase 6Cが進めやすくなっている
- READMEから設計書へ辿れる
