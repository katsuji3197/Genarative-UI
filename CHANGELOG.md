# 変更履歴

## [v2] - 2025-11-01

### 🐛 修正

#### 1. ユーザー名変更タスクのデータが記録されない問題

**問題**:
- `exp_task_username_change_time` と `exp_task_username_change_clicks` がCSVで空になっていた

**原因**:
- ProfileSettingsコンポーネントで`onTaskComplete`が呼ばれていたが、`handleTaskComplete`内で`endExperimentTask`が呼ばれていなかった
- カンバンタスクの完了は`handleExperimentAction`で処理されていたが、ユーザー名変更タスクは別の経路だった

**修正内容**:
```typescript
// src/app/page.tsx - handleTaskComplete
if (success && !experimentConditions[taskId]) {
  experimentData.endExperimentTask?.(taskId);
}
```

**影響**:
- ユーザー名変更タスクの所要時間とクリック数が正しく記録されるようになった

---

#### 2. 事後アンケートのデータがCSVに反映されない問題

**問題**:
- `post_q1_seq`, `post_q2_satisfaction`, `post_q3_preference` が-1（未回答）として記録される
- `post_q4_comment`（自由記述）が空として記録される

**原因**:
- Reactの`setState`は非同期であり、`recordPostSurveyAnswers`の更新が完了する前に`downloadCSV`が実行されていた
- タイミングの問題により、最新の事後アンケートデータがCSVに含まれなかった

**修正内容**:
```typescript
// src/hooks/useExperimentData.ts
const generateCSVData = useCallback((postSurveyOverride?: PostSurveyAnswers) => {
  const data = experimentData as ExperimentData & Record<string, any>;
  
  // 事後アンケートが引数で渡された場合は、それを使用（最新の値を保証）
  if (postSurveyOverride) {
    data.post_q1_seq = postSurveyOverride.q1_seq;
    data.post_q2_satisfaction = postSurveyOverride.q2_satisfaction;
    data.post_q3_preference = postSurveyOverride.q3_preference;
    data.post_q4_comment = postSurveyOverride.q4_comment;
  }
  // ...
}, [experimentData]);

// src/app/page.tsx - handlePostSurveySubmit
experimentData.downloadCSV(answers); // 回答を直接渡す
```

**影響**:
- 事後アンケートのすべてのデータが正確にCSVに記録されるようになった
- タイミングの問題が解消された

---

### 📊 データフロー

#### 実験タスクの記録フロー

```
1. ダッシュボード表示時（実験開始）
   └─> startExperimentTask() × 5タスク
       ├─> username_change
       ├─> kanban_drag
       ├─> kanban_edit
       ├─> kanban_delete
       └─> kanban_add

2. タスク完了時
   ├─> カンバンタスク: handleExperimentAction()
   │   └─> endExperimentTask(taskKey)
   │
   └─> ユーザー名変更: handleTaskComplete()
       └─> endExperimentTask(taskKey)  ← 🆕 追加
       
3. 実験データに記録
   ├─> exp_task_{taskKey}_time: 所要時間（秒）
   └─> exp_task_{taskKey}_clicks: クリック数
```

#### 事後アンケートの記録フロー

```
1. PostSurveyModal
   └─> onSubmit(answers)

2. handlePostSurveySubmit()
   ├─> recordPostSurveyAnswers(answers)  // 状態管理用
   └─> downloadCSV(answers)               // CSV生成用 🆕 直接渡す
   
3. generateCSVData(postSurveyOverride)   // 🆕 オーバーライド機能
   └─> 最新の事後アンケートデータを使用
```

---

### ✅ テスト結果

修正後のCSVファイルで以下が確認できること:

1. **ユーザー名変更タスク**:
   - `exp_task_username_change_time`: 数値（秒）
   - `exp_task_username_change_clicks`: 数値（回数）

2. **事後アンケート**:
   - `post_q1_seq`: 1-7の範囲の数値
   - `post_q2_satisfaction`: 1-7の範囲の数値
   - `post_q3_preference`: 1-7の範囲の数値
   - `post_q4_comment`: 文字列（空でも記録される）

3. **その他のタスク**:
   - `exp_task_kanban_drag_time` / `_clicks`
   - `exp_task_kanban_edit_time` / `_clicks`
   - `exp_task_kanban_delete_time` / `_clicks`
   - `exp_task_kanban_add_time` / `_clicks`

---

## [v1] - 2025-11-01（初回実装）

### 🎉 初回リリース

- 実験データ収集システムの実装
- CSV出力機能の実装
- 実験タスク（チェックリスト）ベースの記録システム
- 事前アンケート・事後アンケートの統合
- UI設定とAI判断理由の記録
- Presentation設定の記録

詳細は `EXPERIMENT_DATA_SPECIFICATION.md` を参照。

