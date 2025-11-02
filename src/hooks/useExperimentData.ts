import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import {
  ExperimentData,
  PreSurveyAnswers,
  PostSurveyAnswers,
  UIConfig,
  ExperimentMode,
} from "@/types";

export const useExperimentData = (participantId: string) => {
  const initializedRef = useRef(false);
  const [experimentData, setExperimentData] = useState<Partial<ExperimentData>>(() => ({
    participant_id: '',
    timestamp: '',
    experiment_start_time: 0, // 実験開始時刻
    group: undefined,
    ui_layout: undefined,
    ui_text: undefined,
    ui_button: undefined,
    ui_input: undefined,
    ui_description: undefined,
    presentation: undefined,
    reasons: undefined,
    pre_q1_confidence: 0,
    pre_q2_preference: 0,
    pre_q3_text_issue: 0,
    pre_q4_tap_error: 0,
    pre_q5_priority: 0,
    pre_q6_icon_score: '',
    total_clicks: 0,
    task_success: 0,
    post_q1_seq: -1,
    post_q2_satisfaction: -1,
    post_q3_preference: -1,
    post_q4_comment: '',
  }));

  // participantId が設定されたときの初期化（一度だけ）
  useEffect(() => {
    if (participantId && !initializedRef.current) {
      initializedRef.current = true;
      const startTime = Date.now();
      setExperimentData(prev => ({
        ...prev,
        participant_id: participantId,
        timestamp: new Date().toISOString(),
        experiment_start_time: startTime,
      }));
    }
  }, [participantId]);


  const [clickCount, setClickCount] = useState(0);
  const clickCountRef = useRef(0);
  // クリック計測の有効フラグ
  const clickTrackingActiveRef = useRef(false);
  
  // 実験タスクごとのデータ（チェックリスト: username_change, kanban_drag, etc.）
  const experimentTaskDataRef = useRef<Record<string, { startTime: number; startClicks: number; endTime?: number; endClicks?: number }>>({});

  // 実験モードの設定
  const setExperimentMode = useCallback((mode: ExperimentMode) => {
    console.log("🔬 実験モードを設定:", mode);
    setExperimentData((prev) => ({
      ...prev,
      group: mode,
    }));
  }, []);

  // UIコンフィグの設定
  const setUIConfig = useCallback((config: UIConfig) => {
    const presentation = (config as any).presentation;
    const reasons = (config as any).reasons;
    
    console.log("💾 UIConfig保存開始:", {
      基本設定: {
        layout: config.layout,
        text: config.text,
        button: config.button,
        input: config.input,
        description: config.description,
      },
      presentation: presentation,
      reasons: reasons,
    });
    
    setExperimentData((prev) => ({
      ...prev,
      ui_layout: config.layout,
      ui_text: config.text,
      ui_button: config.button,
      ui_input: config.input,
      ui_description: config.description,
      // presentation と reasons も保存（存在する場合）
      ...(presentation ? { presentation } : {}),
      ...(reasons ? { reasons } : {}),
      // buttonSize情報も保存（button設定から決定される）
      [`ui_button_size_plus`]: config.button, // buttonSize.plusButton[config.button] となる設定値
    }));
    
    console.log("✅ UIConfig を保存しました");
  }, []);

  // 事前アンケートの回答を記録
  const recordPreSurveyAnswers = useCallback((answers: PreSurveyAnswers) => {
    console.log("📋 事前アンケート回答を記録:", answers);
    setExperimentData((prev) => ({
      ...prev,
      pre_q1_confidence: answers.q1_confidence,
      pre_q2_preference: answers.q2_preference,
      pre_q3_text_issue: answers.q3_text_issue,
      pre_q4_tap_error: answers.q4_tap_error,
      pre_q5_priority: answers.q5_priority,
      pre_q6_icon_score: answers.q6_icon_score,
    }));
    console.log("✅ 事前アンケート回答を記録完了");
  }, []);

  // 事後アンケートの回答を記録
  const recordPostSurveyAnswers = useCallback((answers: PostSurveyAnswers) => {
    console.log("📋 事後アンケート回答を記録:", answers);
    setExperimentData((prev) => ({
      ...prev,
      post_q1_seq: answers.q1_seq,
      post_q2_satisfaction: answers.q2_satisfaction,
      post_q3_preference: answers.q3_preference,
      post_q4_comment: answers.q4_comment,
    }));
    console.log("✅ 事後アンケート回答を記録完了");
  }, []);



  // クリック数をカウント
  const incrementClickCount = useCallback(() => {
    clickCountRef.current += 1;
    setClickCount(clickCountRef.current);
    setExperimentData((prev) => ({
      ...prev,
      total_clicks: clickCountRef.current,
    }));
  }, []);

  const startClickTracking = useCallback(() => {
    clickTrackingActiveRef.current = true;
  }, []);

  const stopClickTracking = useCallback(() => {
    clickTrackingActiveRef.current = false;
  }, []);

  // タスクの完了を記録
  const recordTaskCompletion = useCallback((success: boolean) => {
    console.log(`📊 タスク完了を記録: ${success ? '成功' : '失敗'}`);
    setExperimentData((prev) => ({
      ...prev,
      task_success: success ? 1 : 0,
    }));
  }, []);

  // 実験タスク（チェックリスト）の開始を記録
  const startExperimentTask = useCallback((taskKey: string) => {
    const now = Date.now();
    const currentClicks = clickCountRef.current;
    experimentTaskDataRef.current[taskKey] = {
      startTime: now,
      startClicks: currentClicks,
    };
    console.log(`🎯 実験タスク開始: ${taskKey} (時刻: ${now}, クリック数: ${currentClicks})`);
  }, []);

  // 実験タスク（チェックリスト）の終了を記録
  const endExperimentTask = useCallback((taskKey: string) => {
    const now = Date.now();
    const currentClicks = clickCountRef.current;
    const taskData = experimentTaskDataRef.current[taskKey];
    
    if (!taskData) {
      console.warn(`⚠️ 実験タスク ${taskKey} の開始データが見つかりません`);
      return;
    }

    taskData.endTime = now;
    taskData.endClicks = currentClicks;
    
    const duration = (now - taskData.startTime) / 1000; // 秒単位
    const clicks = currentClicks - taskData.startClicks;
    
    console.log(`✅ 実験タスク完了: ${taskKey} (所要時間: ${duration}秒, クリック数: ${clicks})`);
    
    // 実験データに記録
    setExperimentData((prev) => ({
      ...prev,
      [`exp_task_${taskKey}_time`]: duration,
      [`exp_task_${taskKey}_clicks`]: clicks,
    }));
  }, []);

  // CSVデータの生成
  const generateCSVData = useCallback((postSurveyOverride?: PostSurveyAnswers) => {
    const data = experimentData as ExperimentData & Record<string, any>;
    
    // 事後アンケートが引数で渡された場合は、それを使用（最新の値を保証）
    if (postSurveyOverride) {
      data.post_q1_seq = postSurveyOverride.q1_seq;
      data.post_q2_satisfaction = postSurveyOverride.q2_satisfaction;
      data.post_q3_preference = postSurveyOverride.q3_preference;
      data.post_q4_comment = postSurveyOverride.q4_comment;
    }
    
    console.log("📊 CSV生成開始 - 実験データ:", data);
    
    // 基本情報
    const headers: string[] = [
      "participant_id",
      "timestamp",
      "group",
    ];

    // UI設定（基本5項目）
    headers.push(
      "ui_layout",
      "ui_text",
      "ui_button",
      "ui_input",
      "ui_description",
      "ui_button_size_plus"
    );

    // Presentation設定を追加
    if ((data as any).presentation && typeof (data as any).presentation === "object") {
      const pres = (data as any).presentation;
      
      // global設定
      if (pres.global !== undefined) {
        headers.push("presentation_global");
      }
      
      // buttons設定（menu, addTask, defaultなど）
      if (pres.buttons && typeof pres.buttons === "object") {
        const buttonKeys = Object.keys(pres.buttons).sort(); // ソートして順序を固定
        buttonKeys.forEach((k) => {
          headers.push(`presentation_button_${k}`);
        });
      }
    }

    // 判断理由（reasons）を追加
    if ((data as any).reasons && typeof (data as any).reasons === "object") {
      const reasonKeys = Object.keys((data as any).reasons).sort(); // ソートして順序を固定
      reasonKeys.forEach((k) => {
        headers.push(`reason_${k}`);
      });
    }

    // 事前アンケート
    headers.push(
      "pre_q1_confidence",
      "pre_q2_preference",
      "pre_q3_text_issue",
      "pre_q4_tap_error",
      "pre_q5_priority",
      "pre_q6_icon_score"
    );

    // 実験タスク（チェックリスト）の時間とクリック数
    const experimentTaskKeys = [
      "username_change",
      "kanban_drag", 
      "kanban_edit",
      "kanban_delete",
      "kanban_add"
    ];
    
    experimentTaskKeys.forEach((taskKey) => {
      headers.push(`exp_task_${taskKey}_time`);
      headers.push(`exp_task_${taskKey}_clicks`);
    });

    // 行動データ
    headers.push(
      "total_times",  // 実験全体の所要時間（秒）
      "total_clicks",
      "task_success"
    );

    // 事後アンケート
    headers.push(
      "post_q1_seq",
      "post_q2_satisfaction",
      "post_q3_preference",
      "post_q4_comment"
    );

    console.log("📋 CSVヘッダー:", headers);

    // 値の抽出
    const values = headers.map((header) => {
      let value: any;

      // total_timesの特殊処理（実験全体の所要時間を計算）
      if (header === "total_times") {
        const startTime = data.experiment_start_time;
        if (startTime && typeof startTime === 'number') {
          const endTime = Date.now();
          value = ((endTime - startTime) / 1000).toFixed(3); // 秒単位、小数点3桁
        } else {
          value = "";
        }
      } else if (header === "presentation_global") {
        value = ((data as any).presentation && (data as any).presentation.global) ?? "";
      } else if (header.startsWith("presentation_button_")) {
        const key = header.replace("presentation_button_", "");
        value = ((data as any).presentation && 
                 (data as any).presentation.buttons && 
                 (data as any).presentation.buttons[key]) ?? "";
      } else if (header.startsWith("reason_")) {
        const key = header.replace("reason_", "");
        value = ((data as any).reasons && (data as any).reasons[key]) ?? "";
      } else {
        // 通常のフィールド
        value = data[header as keyof (ExperimentData & Record<string, any>)];
      }

      // CSV形式に変換（カンマやダブルクォートのエスケープ）
      if (value === undefined || value === null) {
        return "";
      }
      
      const stringValue = String(value);
      
      // カンマ、改行、ダブルクォートが含まれる場合はダブルクォートで囲む
      if (stringValue.includes(",") || stringValue.includes("\n") || stringValue.includes('"')) {
        // ダブルクォートは2つ重ねてエスケープ
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      
      return stringValue;
    });

    console.log("📊 CSV値:", values);
    console.log("✅ CSV生成完了");

    return [headers.join(","), values.join(",")].join("\n");
  }, [experimentData]);

  // CSVファイルのダウンロード
  const downloadCSV = useCallback((postSurveyOverride?: PostSurveyAnswers) => {
    const csvData = generateCSVData(postSurveyOverride);
    const blob = new Blob([csvData], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `exp_result_${participantId}_${new Date()
        .toISOString()
        .slice(0, 16)
        .replace(/[:-]/g, "")}.csv`
    );
    link.style.visibility = "hidden";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [generateCSVData, participantId]);

  // グローバルクリックイベントの監視
  useEffect(() => {
    const handleGlobalClick = () => {
      if (clickTrackingActiveRef.current) incrementClickCount();
    };

    document.addEventListener("click", handleGlobalClick);
    return () => {
      document.removeEventListener("click", handleGlobalClick);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // 依存配列を空にして、マウント時に一度だけ設定

  return useMemo(() => ({
    experimentData,
    clickCount,
    setExperimentMode,
    setUIConfig,
    recordPreSurveyAnswers,
    recordPostSurveyAnswers,
    incrementClickCount,
    recordTaskCompletion,
    startClickTracking,
    stopClickTracking,
    startExperimentTask,
    endExperimentTask,
    downloadCSV,
    generateCSVData,
  }), [
    experimentData,
    clickCount,
    setExperimentMode,
    setUIConfig,
    recordPreSurveyAnswers,
    recordPostSurveyAnswers,
    incrementClickCount,
    recordTaskCompletion,
    startClickTracking,
    stopClickTracking,
    startExperimentTask,
    endExperimentTask,
    downloadCSV,
    generateCSVData,
  ]);
};
