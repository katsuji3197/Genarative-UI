import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import {
  ExperimentData,
  TimeMetrics,
  PreSurveyAnswers,
  PostSurveyAnswers,
  UIConfig,
  ExperimentMode,
  Task,
} from "@/types";

export const useExperimentData = (participantId: string) => {
  const initializedRef = useRef(false);
  const [experimentData, setExperimentData] = useState<Partial<ExperimentData>>(() => ({
    participant_id: '',
    timestamp: '',
    total_clicks: 0,
    task_success: 0,
  }));

  // participantId が設定されたときの初期化（一度だけ）
  useEffect(() => {
    if (participantId && !initializedRef.current) {
      initializedRef.current = true;
      setExperimentData(prev => ({
        ...prev,
        participant_id: participantId,
        timestamp: new Date().toISOString(),
      }));
    }
  }, [participantId]);

  const [timeMetrics, setTimeMetrics] = useState<TimeMetrics>({
    dashboard_start: 0,
    dashboard_end: 0,
    profile_start: 0,
    profile_end: 0,
    task_start: 0,
    task_end: 0,
  });

  const [clickCount, setClickCount] = useState(0);
  const clickCountRef = useRef(0);
  // クリック計測の有効フラグ
  const clickTrackingActiveRef = useRef(false);

  // タスクごとの時間計測 (taskId -> { start, end })
  const taskTimersRef = useRef<Record<string, { start: number; end?: number }>>({});

  // 実験モードの設定
  const setExperimentMode = useCallback((mode: ExperimentMode) => {
    setExperimentData((prev) => ({
      ...prev,
      group: mode,
    }));
  }, []);

  // UIコンフィグの設定
  const setUIConfig = useCallback((config: UIConfig) => {
    setExperimentData((prev) => ({
      ...prev,
      ui_layout: config.layout,
      ui_text: config.text,
      ui_button: config.button,
      ui_input: config.input,
      ui_description: config.description,
    }));
  }, []);

  // 事前アンケートの回答を記録
  const recordPreSurveyAnswers = useCallback((answers: PreSurveyAnswers) => {
    setExperimentData((prev) => ({
      ...prev,
      pre_q1_confidence: answers.q1_confidence,
      pre_q2_preference: answers.q2_preference,
      pre_q3_text_issue: answers.q3_text_issue,
      pre_q4_tap_error: answers.q4_tap_error,
      pre_q5_priority: answers.q5_priority,
      pre_q6_icon_score: answers.q6_icon_score,
    }));
  }, []);

  // 事後アンケートの回答を記録
  const recordPostSurveyAnswers = useCallback((answers: PostSurveyAnswers) => {
    setExperimentData((prev) => ({
      ...prev,
      post_q1_seq: answers.q1_seq,
      post_q2_satisfaction: answers.q2_satisfaction,
      post_q3_preference: answers.q3_preference,
      post_q4_comment: answers.q4_comment,
    }));
  }, []);

  // 時間計測の開始
  const startTimeTracking = useCallback(
    (phase: "dashboard" | "profile" | "task") => {
      const now = Date.now();
      setTimeMetrics((prev) => ({
        ...prev,
        [`${phase}_start`]: now,
      }));
    },
    []
  );

  // 時間計測の終了
  const endTimeTracking = useCallback(
    (phase: "dashboard" | "profile" | "task") => {
      const now = Date.now();
      setTimeMetrics((prev) => {
        const newMetrics = {
          ...prev,
          [`${phase}_end`]: now,
        };

        // 時間データを実験データに記録
        const startTime = prev[`${phase}_start` as keyof TimeMetrics];
        const duration = startTime ? (now - startTime) / 1000 : 0;

        setExperimentData((expData) => ({
          ...expData,
          [`time_${phase}`]: duration,
          ...(phase === "task" && { time_task_total: duration }),
        }));

        return newMetrics;
      });
    },
    []
  );

  // タスク単位の時間計測開始
  const startTaskTimer = useCallback((taskId: string) => {
    const now = Date.now();
    taskTimersRef.current[taskId] = { start: now };
  }, []);

  // タスク単位の時間計測終了
  const endTaskTimer = useCallback((taskId: string) => {
    const now = Date.now();
    const timers = taskTimersRef.current[taskId];
    if (!timers || !timers.start) return;
    const duration = (now - timers.start) / 1000;

    // 保存
    taskTimersRef.current[taskId].end = now;
    setExperimentData((prev) => ({
      ...prev,
      // 動的なキー名でタスクごとの所要時間を保存
      [`time_task_${taskId}`]: duration,
    }));
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
    setExperimentData((prev) => ({
      ...prev,
      task_success: success ? 1 : 0,
    }));
  }, []);

  // CSVデータの生成
  // CSVデータの生成
  // 引数にtasksを渡すと、タスクごとの所要時間カラムを追加して出力します
  const generateCSVData = useCallback((tasks?: Task[]) => {
    const data = experimentData as ExperimentData & Record<string, any>;
    const headers: string[] = [
      "participant_id",
      "timestamp",
      "group",
      "ui_layout",
      "ui_text",
      "ui_button",
      "ui_input",
      "ui_description",
      "pre_q1_confidence",
      "pre_q2_preference",
      "pre_q3_text_issue",
      "pre_q4_tap_error",
      "pre_q5_priority",
      "pre_q6_icon_score",
      "time_dashboard",
      "time_profile",
      "time_task_total",
    ];

    // タスクごとの時間カラムを挿入（存在するタスクが渡された場合）
    if (tasks && tasks.length > 0) {
      tasks.forEach((t) => {
        headers.push(`time_task_${t.id}`);
      });
    }

    // If experiment data contains a presentation object, add presentation fields
    // presentation: { global, buttons: { key: mode } }
    if ((data as any).presentation && typeof (data as any).presentation === "object") {
      const pres = (data as any).presentation;
      if (pres.global) headers.push("presentation_global");
      if (pres.buttons && typeof pres.buttons === "object") {
        Object.keys(pres.buttons).forEach((k) => headers.push(`presentation_button_${k}`));
      }
    }

    // If there are reasons recorded, add them as columns
    if ((data as any).reasons && typeof (data as any).reasons === "object") {
      Object.keys((data as any).reasons).forEach((k) => headers.push(`reason_${k}`));
    }

    headers.push("total_clicks", "task_success", "post_q1_seq", "post_q2_satisfaction", "post_q3_preference", "post_q4_comment");

    const values = headers.map((header) => {
      // derived presentation fields
      if (header === "presentation_global") {
        return ((data as any).presentation && (data as any).presentation.global) ?? "";
      }
      if (header.startsWith("presentation_button_")) {
        const key = header.replace("presentation_button_", "");
        return ((data as any).presentation && (data as any).presentation.buttons && (data as any).presentation.buttons[key]) ?? "";
      }
      if (header.startsWith("reason_")) {
        const key = header.replace("reason_", "");
        return ((data as any).reasons && (data as any).reasons[key]) ?? "";
      }

      const value = data[header as keyof (ExperimentData & Record<string, any>)];
      if (typeof value === "string" && value.includes(",")) {
        return `"${value}"`;
      }
      return value !== undefined && value !== null ? value : "";
    });

    return [headers.join(","), values.join(",")].join("\n");
  }, [experimentData]);

  // CSVファイルのダウンロード
  const downloadCSV = useCallback((tasks?: Task[]) => {
    const csvData = generateCSVData(tasks);
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
    timeMetrics,
    clickCount,
    setExperimentMode,
    setUIConfig,
    recordPreSurveyAnswers,
    recordPostSurveyAnswers,
    startTimeTracking,
    endTimeTracking,
    incrementClickCount,
    recordTaskCompletion,
    startTaskTimer,
    endTaskTimer,
    startClickTracking,
    stopClickTracking,
    downloadCSV,
    generateCSVData,
  }), [
    experimentData,
    timeMetrics,
    clickCount,
    setExperimentMode,
    setUIConfig,
    recordPreSurveyAnswers,
    recordPostSurveyAnswers,
    startTimeTracking,
    endTimeTracking,
    incrementClickCount,
    recordTaskCompletion,
    startTaskTimer,
    endTaskTimer,
    startClickTracking,
    stopClickTracking,
    downloadCSV,
    generateCSVData,
  ]);
};
