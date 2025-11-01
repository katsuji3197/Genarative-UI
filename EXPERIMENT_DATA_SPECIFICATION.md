# 実験データ仕様書

## 概要
このドキュメントは、「ユーザー属性に基づくGenerative UIのUX向上効果に関する研究」実験アプリケーションで収集・出力されるデータの完全な仕様を記載します。

## 最新の修正（2025-11-01 v3）

### 修正した問題
1. ✅ **`total_times`の追加**
   - `total_clicks`の前に`total_times`（実験全体の所要時間）を追加
   - 実験開始時刻（`experiment_start_time`）を記録し、CSV生成時に経過時間を計算

2. ✅ **不要な時間計測データの削除**
   - `time_dashboard`, `time_profile`, `time_task_total`を削除
   - 実験タスクごとの詳細時間（`exp_task_*_time`）で十分なため
   - `TimeMetrics`、`startTimeTracking`、`endTimeTracking`関連の全コードを削除

### 影響を受けるファイル
- `/src/hooks/useExperimentData.ts`: `total_times`の追加、時間計測関数の削除
- `/src/app/page.tsx`: 時間計測関連のコールバック削除
- `/src/components/Dashboard.tsx`: `onTimeTrackingStart`の削除
- `/src/components/ProfileSettings.tsx`: `onTimeTrackingStart`, `onTimeTrackingEnd`の削除

---

## 過去の修正（2025-11-01 v2）

### 修正した問題
1. ✅ **ユーザー名変更タスクのデータが記録されない問題**
   - 原因: `handleTaskComplete`で`endExperimentTask`が呼ばれていなかった
   - 修正: ユーザー名変更タスク完了時に`endExperimentTask`を呼び出すように追加

2. ✅ **事後アンケートのデータがCSVに反映されない問題**
   - 原因: `setState`が非同期のため、CSV生成時にデータが更新される前に実行されていた
   - 修正: `downloadCSV`に事後アンケートの回答を直接渡す機能を追加（`postSurveyOverride`パラメータ）

## CSV出力データ項目

### 1. 基本情報（3項目）
| カラム名 | データ型 | 説明 |
|---------|---------|------|
| participant_id | string | 参加者ID（自動生成） |
| timestamp | string | 実験開始時刻（ISO 8601形式） |
| group | string | 実験グループ（experimental/control） |

### 2. UI設定（基本5項目）
| カラム名 | データ型 | 可能な値 | 説明 |
|---------|---------|---------|------|
| ui_layout | string | standard/novice/expert | レイアウトの複雑さ |
| ui_text | string | standard/novice/expert | テキストサイズ |
| ui_button | string | standard/novice/expert | ボタンサイズ |
| ui_input | string | standard/novice/expert | 入力フィールドサイズ |
| ui_description | string | standard/novice/expert | 説明の詳細さ |

### 3. Presentation設定（アイコン/テキスト表示）
| カラム名 | データ型 | 可能な値 | 説明 |
|---------|---------|---------|------|
| presentation_global | string | icon/text/icon_text | グローバル表示設定 |
| presentation_button_addTask | string | icon/text/icon_text | タスク追加ボタンの表示 |
| presentation_button_default | string | icon/text/icon_text | デフォルトボタンの表示 |
| presentation_button_menu | string | icon/text/icon_text | メニューボタンの表示 |
| presentation_taskAction_default | string | inline/menu/icon-only | タスクアクション表示方法 |
| presentation_taskAction_modes | string | セミコロン区切り | 利用可能なタスクアクションモード |

### 4. AI判断理由（reasons）
| カラム名 | データ型 | 説明 |
|---------|---------|------|
| reason_layout | string | レイアウト設定の判断理由 |
| reason_text | string | テキスト設定の判断理由 |
| reason_button | string | ボタン設定の判断理由 |
| reason_input | string | 入力フィールド設定の判断理由 |
| reason_description | string | 説明設定の判断理由 |
| reason_presentation | string | Presentation設定の判断理由 |

### 5. 事前アンケート（6項目）
| カラム名 | データ型 | 範囲 | 説明 |
|---------|---------|------|------|
| pre_q1_confidence | number | 1-5 | デジタル機器操作への自信（5=とても自信がある、1=全く自信がない） |
| pre_q2_preference | number | 1-5 | 情報量の好み（1=情報量が多い方が好き、5=情報量が少ない方が好き） |
| pre_q3_text_issue | number | 1-5 | 文字サイズの見やすさ（1=小さい文字でも見やすい、5=大きい文字の方がいい） |
| pre_q4_tap_error | number | 1-5 | ボタンの押し間違いの頻度（1=ほとんど押し間違えない、5=よく押し間違える） |
| pre_q5_priority | number | 1-5 | 操作の優先順位（1=速さ重視、5=正確性重視） |
| pre_q6_icon_score | string | X/5形式 | アイコン理解度テストの結果（例: "3/5"） |

### 6. 実験タスク（チェックリスト）データ（10項目）
各実験タスクについて、所要時間とクリック数を記録します。

| カラム名 | データ型 | 単位 | 説明 |
|---------|---------|------|------|
| exp_task_username_change_time | number | 秒 | ユーザー名変更タスクの所要時間 |
| exp_task_username_change_clicks | number | 回 | ユーザー名変更タスクのクリック数 |
| exp_task_kanban_drag_time | number | 秒 | カンバンドラッグ移動タスクの所要時間 |
| exp_task_kanban_drag_clicks | number | 回 | カンバンドラッグ移動タスクのクリック数 |
| exp_task_kanban_edit_time | number | 秒 | カンバン編集タスクの所要時間 |
| exp_task_kanban_edit_clicks | number | 回 | カンバン編集タスクのクリック数 |
| exp_task_kanban_delete_time | number | 秒 | カンバン削除タスクの所要時間 |
| exp_task_kanban_delete_clicks | number | 回 | カンバン削除タスクのクリック数 |
| exp_task_kanban_add_time | number | 秒 | カンバン追加タスクの所要時間 |
| exp_task_kanban_add_clicks | number | 回 | カンバン追加タスクのクリック数 |

**計測方法**: 
- すべての実験タスクは、ダッシュボード表示時（実験開始時）に計測開始
- 各タスクが完了した時点で、開始時刻からの経過時間とクリック数を記録
- 完了時のクリック数 = その時点の総クリック数 - 開始時のクリック数

### 7. 行動データ（3項目）
| カラム名 | データ型 | 単位 | 説明 |
|---------|---------|------|------|
| total_times | number | 秒 | 実験全体の所要時間（実験開始から事後アンケート完了まで） |
| total_clicks | number | 回 | 実験中の総クリック数 |
| task_success | number | - | タスク成功（1）/失敗（0） |

**`total_times`の計測方法**:
- 実験開始時（participantId設定時）に`experiment_start_time`を記録
- CSV生成時に現在時刻から開始時刻を引いて計算
- 秒単位、小数点3桁で記録

### 8. 事後アンケート（4項目）
| カラム名 | データ型 | 範囲 | 説明 |
|---------|---------|------|------|
| post_q1_seq | number | 1-7 | タスクの容易性評価（1=とても困難、7=とても簡単） |
| post_q2_satisfaction | number | 1-7 | 操作全体の満足度（1=とても不満、7=とても満足） |
| post_q3_preference | number | 1-7 | UIの好み評価（1=とても嫌い、7=とても好き） |
| post_q4_comment | string | - | 自由記述コメント |

## データ収集フロー

### 1. 事前アンケート
```
PreSurveyModal.tsx
  ↓ (ユーザーが回答)
  ↓ iconAnswers → Gemini API → q6_icon_score
  ↓
handlePreSurveySubmit (page.tsx)
  ↓
experimentData.recordPreSurveyAnswers()
  ↓ 事前アンケートデータを保存
  ↓
geminiService.generateUIConfig() ※実験群の場合
  ↓ UIConfig + presentation + reasons
  ↓
experimentData.setUIConfig()
  ↓ UI設定、presentation、reasonsを保存
```

### 2. 実験タスク実行
```
Dashboard.tsx
  ↓ タスク操作（追加、編集、削除、移動）
  ↓
onTasksChange → handleTasksChange (page.tsx)
  ↓
setExperimentTasks() ← タスク一覧を保存
  ↓
experimentData.startTaskTimer(taskId)
experimentData.endTaskTimer(taskId)
  ↓ 各タスクの時間を計測・保存
```

### 3. 事後アンケート・CSV出力
```
PostSurveyModal.tsx
  ↓ (ユーザーが回答)
  ↓
handlePostSurveySubmit (page.tsx)
  ↓
experimentData.recordPostSurveyAnswers()
  ↓ 事後アンケートデータを保存
  ↓
experimentData.downloadCSV(experimentTasks)
  ↓ タスク一覧を渡してCSV生成・ダウンロード
```

## CSV出力形式

### ヘッダー行
```csv
participant_id,timestamp,group,ui_layout,ui_text,ui_button,ui_input,ui_description,presentation_global,presentation_button_addTask,presentation_button_default,presentation_button_menu,presentation_taskAction_default,presentation_taskAction_modes,reason_button,reason_description,reason_input,reason_layout,reason_presentation,reason_text,pre_q1_confidence,pre_q2_preference,pre_q3_text_issue,pre_q4_tap_error,pre_q5_priority,pre_q6_icon_score,exp_task_username_change_time,exp_task_username_change_clicks,exp_task_kanban_drag_time,exp_task_kanban_drag_clicks,exp_task_kanban_edit_time,exp_task_kanban_edit_clicks,exp_task_kanban_delete_time,exp_task_kanban_delete_clicks,exp_task_kanban_add_time,exp_task_kanban_add_clicks,total_times,total_clicks,task_success,post_q1_seq,post_q2_satisfaction,post_q3_preference,post_q4_comment
```

### データ行の例
```csv
exp_20250101_120000,2025-01-01T12:00:00.000Z,experimental,novice,standard,novice,novice,standard,icon_text,icon_text,icon_text,icon,inline,inline;menu;icon-only,"誤タップ頻度4から判断","自信度2と優先順位4から判断","誤タップ4と自信度2の組み合わせ","自信度2、情報量好み4から判断","アイコンスコア3/5と誤タップ頻度4から判断","文字サイズの見やすさ3から判断",2,4,3,4,4,3/5,5.2,3,8.5,4,12.1,5,10.3,6,6.2,2,42.350,87,1,6,6,7,"とても使いやすかったです"
```

**データの説明**:
- 実験タスク:
  - `exp_task_username_change`: 5.2秒、3クリック
  - `exp_task_kanban_drag`: 8.5秒、4クリック  
  - `exp_task_kanban_edit`: 12.1秒、5クリック
  - `exp_task_kanban_delete`: 10.3秒、6クリック
  - `exp_task_kanban_add`: 6.2秒、2クリック
- 行動データ:
  - `total_times`: 42.350秒（実験全体）
  - `total_clicks`: 87クリック（実験全体）

## デバッグログ

実験データの収集状況を確認するため、以下のコンソールログが出力されます：

### 1. 実験モード設定
```javascript
console.log("🔬 実験モードを設定:", mode);
```

### 2. UI設定保存
```javascript
console.log("💾 UIConfig保存開始:", { 基本設定, presentation, reasons });
console.log("✅ UIConfig を保存しました");
```

### 3. 事前アンケート記録
```javascript
console.log("📋 事前アンケート回答を記録:", answers);
console.log("✅ 事前アンケート回答を記録完了");
```

### 4. 事後アンケート記録
```javascript
console.log("📝 事後アンケート回答:", answers);
console.log("📋 事後アンケート回答を記録:", answers);
console.log("✅ 事後アンケート回答を記録完了");
```

### 5. 実験タスクの記録
```javascript
console.log("🎯 実験タスクの計測を開始");
console.log("🎯 実験タスク開始: ${taskKey} (時刻: ${now}, クリック数: ${currentClicks})");
console.log("🎯 実験アクション: ${actionKey}");
console.log("✅ 実験タスク完了: ${taskKey} (所要時間: ${duration}秒, クリック数: ${clicks})");
```

### 6. CSV出力
```javascript
console.log("📥 CSV出力前の実験データ:", experimentData);
console.log("📊 CSV生成開始 - 実験データ:", data);
console.log("📋 CSVヘッダー:", headers);
console.log("📊 CSV値:", values);
console.log("✅ CSV生成完了");
```

## 注意事項

### データの完全性
- すべてのアンケート項目が必須です（回答がない場合はアラートが表示されます）
- `presentation`と`reasons`はオプショナルですが、実験群ではGemini APIから自動生成されます
- 実験タスク（チェックリスト）は5つ固定: username_change, kanban_drag, kanban_edit, kanban_delete, kanban_add
- 各実験タスクの時間とクリック数は、タスク完了時に自動記録されます
- 未完了のタスクは空の値としてCSVに出力されます

### CSVエスケープ処理
- カンマ、改行、ダブルクォートを含むデータは自動的にダブルクォートで囲まれます
- ダブルクォート自体は2つ重ねてエスケープされます（RFC 4180準拠）

### ファイル名形式
```
exp_result_{participantId}_{timestamp}.csv
例: exp_result_exp_20250101_120000_20250101T1200.csv
```

## 実装ファイル

- **データ収集**: `/src/hooks/useExperimentData.ts`
- **型定義**: `/src/types/index.ts`
- **事前アンケート**: `/src/components/PreSurveyModal.tsx`
- **事後アンケート**: `/src/components/PostSurveyModal.tsx`
- **UI設定生成**: `/src/lib/gemini.ts`
- **メインフロー**: `/src/app/page.tsx`

## 改修内容サマリ

### 1. `/src/types/index.ts`
- `ExperimentData`インターフェースに`presentation`と`reasons`フィールドを追加
- 動的フィールド（実験タスクごとの時間・クリック数など）をサポートするためインデックスシグネチャを追加

### 2. `/src/hooks/useExperimentData.ts`
- 初期化時に全フィールドを明示的に設定（事後アンケートは-1で初期化）
- **実験タスク記録機能を追加**:
  - `experimentTaskDataRef`: 実験タスクごとの開始時刻・クリック数を記録
  - `startExperimentTask(taskKey)`: 実験タスクの計測開始
  - `endExperimentTask(taskKey)`: 実験タスクの計測終了（所要時間とクリック数を計算）
- `generateCSVData`を実験タスクベースに書き直し：
  - カンバンボードのタスクIDから、実験タスク（チェックリスト）ベースに変更
  - 5つの実験タスクそれぞれについて、時間とクリック数のカラムを出力
  - **事後アンケートのオーバーライド機能を追加**: `postSurveyOverride`パラメータで最新の回答を直接受け取る
  - `presentation.taskAction`のデータを含める
  - CSVヘッダーの順序を整理
  - タスクアクションの`modes`配列をセミコロン区切りで出力
  - CSVエスケープ処理を改善（RFC 4180準拠）
  - 全てのステップにデバッグログを追加
- `downloadCSV`も`postSurveyOverride`パラメータを受け取るように修正

### 3. `/src/app/page.tsx`
- **実験タスク計測の統合**:
  - ダッシュボード表示時（実験開始時）に5つの実験タスクすべての計測を開始
  - `handleExperimentAction`で実験タスク完了時に計測を終了（カンバンタスク）
  - `handleTaskComplete`でも実験タスク完了時に計測を終了（ユーザー名変更タスク）
- `handlePostSurveySubmit`で事後アンケートの回答を直接CSVダウンロード関数に渡す（最新値を保証）
- CSV出力前にデバッグログを出力

### 4. `/src/components/PostSurveyModal.tsx`
- 事後アンケート送信時にデバッグログを追加

## テスト方法

1. アプリケーションを起動
2. ブラウザの開発者ツール（コンソール）を開く
3. 実験を開始し、すべてのステップを完了
4. コンソールログで各ステップのデータを確認
5. CSV出力時に全データが含まれていることを確認

## 期待される出力

- CSVファイルには約43カラムが含まれます（固定）:
  - 基本情報: 3
  - UI設定: 5
  - Presentation設定: 6
  - AI判断理由: 6
  - 事前アンケート: 6
  - 実験タスク: 10（5タスク × 2項目: 時間とクリック数）
  - 行動データ: 3（**`total_times`を含む**）
  - 事後アンケート: 4
- すべてのアンケート項目、UI設定が完全に記録されます
- 各実験タスクの所要時間とクリック数が記録されます
- 実験全体の所要時間（`total_times`）が記録されます
- presentation設定とAI判断理由（実験群の場合）が含まれます

