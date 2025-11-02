"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { PreSurveyModal } from "@/components/PreSurveyModal";
import Dashboard from "../components/Dashboard";
import { ProfileSettings } from "@/components/ProfileSettings";
import { PostSurveyModal } from "@/components/PostSurveyModal";
import { useExperimentData } from "@/hooks/useExperimentData";
import { experimentModeService } from "@/lib/experimentMode";
import { geminiService } from "@/lib/gemini";
import { UIConfig, User, PreSurveyAnswers, PostSurveyAnswers, Task } from "@/types";
import LoadingScreen from "@/components/LoadingScreen";
import RightDrawerMenu from "@/components/RightDrawerMenu";
import NotificationsPage from "@/components/NotificationsPage";
import HelpPage from "@/components/HelpPage";
import AboutPage from "@/components/AboutPage";

type AppState =
  | "pre-survey"
  | "dashboard"
  | "profile"
  | "notifications"
  | "help"
  | "about"
  | "post-survey"
  | "completed";

export default function Home() {
  const [appState, setAppState] = useState<AppState>("pre-survey");
  const [showPreSurvey, setShowPreSurvey] = useState(false);
  const [showPostSurvey, setShowPostSurvey] = useState(false);
  const [uiConfig, setUiConfig] = useState<UIConfig>({
    layout: "standard",
    text: "standard",
    button: "standard",
    input: "standard",
    description: "standard",
  });
  const [user, setUser] = useState<User>({
    id: "demo-user",
    name: "サンプルユーザー",
    email: "sample@example.com",
  });

  const [participantId, setParticipantId] = useState<string>('');
  const experimentData = useExperimentData(participantId);
  // カンバンのタスク状態を保持
  const [experimentTasks, setExperimentTasks] = useState<Task[] | null>(null);

  // 完了済みタスクIDの集合（カンバン個別タスクやその他識別子）
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_completedTaskIds, setCompletedTaskIds] = useState<Record<string, boolean>>({});
  // 実験完了条件（チェックリスト）
  const [experimentConditions, setExperimentConditions] = useState<Record<string, boolean>>({
    username_change: false,
    kanban_drag: false,
    kanban_edit: false,
    kanban_delete: false,
    kanban_add: false,
  });
  // ドロワーに表示するラベル
  const conditionLabels: Record<string, { label: string; description: string }> = {
    username_change: { label: 'ユーザー名を変更', description: 'プロフィール設定で任意のユーザー名を変更してください' },
    kanban_drag: { label: 'カンバンでドラッグ移動', description: 'タスクをドラッグして任意の別の列に移動してください' },
    kanban_edit: { label: 'タスクを編集', description: 'タスクのタイトル、または説明を任意のものに編集してください' },
    kanban_delete: { label: 'カンバンで削除', description: 'タスクを削除してください' },
    kanban_add: { label: 'カンバンで追加', description: '新しい任意のタスクを追加してください' },
  };
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const openTimerRef = useRef<number | null>(null);
  const closeTimerRef = useRef<number | null>(null);

  const clearOpenTimer = () => {
    if (openTimerRef.current) {
      clearTimeout(openTimerRef.current);
      openTimerRef.current = null;
    }
  };

  const clearCloseTimer = () => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  };

  const openDrawerWithDelay = (delay = 200) => {
    clearCloseTimer();
    if (isDrawerOpen) return;
    clearOpenTimer();
    openTimerRef.current = window.setTimeout(() => {
      setIsDrawerOpen(true);
      openTimerRef.current = null;
    }, delay);
  };

  const closeDrawerWithDelay = (delay = 300) => {
    clearOpenTimer();
    if (!isDrawerOpen) return;
    clearCloseTimer();
    closeTimerRef.current = window.setTimeout(() => {
      setIsDrawerOpen(false);
      closeTimerRef.current = null;
    }, delay);
  };

  useEffect(() => {
    return () => {
      clearOpenTimer();
      clearCloseTimer();
    };
  }, []);
  const [postSurveyShown, setPostSurveyShown] = useState(false);
  const [isUILoading, setIsUILoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');

  // タスクの進捗変更を受け取るハンドラ
  const handleTasksChange = useCallback((tasks: Task[]) => {
    setExperimentTasks(tasks);
    // 初期状態で完了しているタスクを completedTaskIds に反映
    const initial: Record<string, boolean> = {};
    tasks.forEach((t) => {
      initial[t.id] = t.status === 'completed';
    });
    setCompletedTaskIds((prev) => ({ ...initial, ...prev }));
  }, []);

  // Dashboard から実験アクション通知を受け取る
  const handleExperimentAction = useCallback((actionKey: string) => {
    console.log(`🎯 実験アクション: ${actionKey}`);
    
    // 実験タスクを完了としてマーク
    setExperimentConditions((prev) => {
      const wasCompleted = prev[actionKey];
      
      // まだ完了していない場合のみ終了を記録
      if (!wasCompleted) {
        experimentData.endExperimentTask?.(actionKey);
      }
      
      return { ...prev, [actionKey]: true };
    });
  }, [experimentData]);

  const handleTaskStatusChange = useCallback((taskId: string, newStatus: Task['status']) => {
    // 親の state 更新が子のレンダリング中に走らないように非同期で実行する
    setTimeout(() => {
      if (newStatus === 'completed') {
        setCompletedTaskIds((prev) => ({ ...prev, [taskId]: true }));
      } else {
        setCompletedTaskIds((prev) => ({ ...prev, [taskId]: false }));
      }
    }, 0);
  }, []);

  // 実験完了条件を監視（ドロワーのチェックリストで満たす）
  useEffect(() => {
    const conditionKeys = Object.keys(experimentConditions);
    const allCompleted = conditionKeys.length > 0 && conditionKeys.every((k) => experimentConditions[k]);
    if (allCompleted && !postSurveyShown) {
      setTimeout(() => {
        // 停止: 事後アンケート表示時にクリック計測を止める
        experimentData.stopClickTracking?.();
        setShowPostSurvey(true);
        setPostSurveyShown(true);
      }, 500);
    }
  }, [experimentConditions, experimentData, postSurveyShown]);

  useEffect(() => {
    // クライアントサイドでのみparticipantIdを生成
    const id = experimentModeService.generateParticipantId();
    setParticipantId(id);
    
    const mode = experimentModeService.getMode();
    experimentData.setExperimentMode(mode);

    // 実験群・統制群に関わらず事前アンケートを表示
    setShowPreSurvey(true);
  }, []); // 初期化は一度だけ実行

  const handlePreSurveySubmit = useCallback(
    async (answers: PreSurveyAnswers) => {
      setShowPreSurvey(false);

      // 事前アンケートの回答を記録
      experimentData.recordPreSurveyAnswers(answers);

      const mode = experimentModeService.getMode();
      console.log("📝 事前アンケート回答:", answers);
      console.log("🎯 実験モード:", mode);
      // UI生成中の読み込みを表示
      setIsUILoading(true);
      setLoadingMessage('UIを生成しています...');

      if (mode === 'experimental') {
        // 実験群の場合：Gemini APIでUI構成を取得
        console.log("🔬 実験群: Gemini APIを使用してUIを生成");
        try {
          const geminiResponse = await geminiService.generateUIConfig(answers);
          console.log("✨ 適用されるUIConfig (実験群):", geminiResponse);

          // geminiResponse may include presentation settings; if so, merge into uiConfig
          const appliedUIConfig: UIConfig & { presentation?: unknown; reasons?: unknown } = {
            layout: geminiResponse.layout as UIConfig['layout'],
            text: geminiResponse.text as UIConfig['text'],
            button: geminiResponse.button as UIConfig['button'],
            input: geminiResponse.input as UIConfig['input'],
            description: geminiResponse.description as UIConfig['description'],
            ...(geminiResponse.presentation ? { presentation: geminiResponse.presentation } : {}),
            ...(geminiResponse.reasons ? { reasons: geminiResponse.reasons } : {}),
          };

          setUiConfig(appliedUIConfig);
          experimentData.setUIConfig(appliedUIConfig);
        } catch (error) {
          console.error("Failed to get UI configuration:", error);
          // フェールした場合でも標準UIを当てる
          const standardConfig = {
            layout: 'standard' as const,
            text: 'standard' as const,
            button: 'standard' as const,
            input: 'standard' as const,
            description: 'standard' as const,
          };
          setUiConfig(standardConfig);
          experimentData.setUIConfig(standardConfig);
        }
      } else {
        // 統制群の場合でも読み込み画面を表示して遅延させる（5秒）
        console.log("🔧 統制群: 読み込みを偽装（待機）");
        setLoadingMessage('読み込み中...');
        await new Promise((resolve) => setTimeout(resolve, 5000));
        const standardConfig = {
          layout: 'standard' as const,
          text: 'standard' as const,
          button: 'standard' as const,
          input: 'standard' as const,
          description: 'standard' as const,
        };
        setUiConfig(standardConfig);
        experimentData.setUIConfig(standardConfig);
      }

      // 読み込み終了 -> ダッシュボード表示、クリック計測開始
      setIsUILoading(false);
      setAppState("dashboard");
      experimentData.startClickTracking?.();
      
      // すべての実験タスクの計測を開始
      console.log("🎯 実験タスクの計測を開始");
      experimentData.startExperimentTask?.('username_change');
      experimentData.startExperimentTask?.('kanban_drag');
      experimentData.startExperimentTask?.('kanban_edit');
      experimentData.startExperimentTask?.('kanban_delete');
      experimentData.startExperimentTask?.('kanban_add');
    },
    [experimentData.setUIConfig]
  );

  const handleProfileClick = useCallback(() => {
    setAppState("profile");
  }, []);

  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleNavigate = useCallback((page: string) => {
    // メニューを閉じて対象ページへ遷移
    setIsMenuOpen(false);
    setAppState(page as AppState);
  }, []);

  const handleBackToDashboard = useCallback(() => {
    setAppState("dashboard");
  }, []);

  const handleSaveUser = useCallback(
    (userData: User) => {
      setUser(userData);

      // ユーザー名変更自体はタスク完了イベントで処理するため、ここでは即時終了しない
    },
    []
  );

  const handlePostSurveySubmit = useCallback(
    (answers: PostSurveyAnswers) => {
      setShowPostSurvey(false);

      // 事後アンケートの回答を記録（状態管理用）
      experimentData.recordPostSurveyAnswers(answers);

      console.log("📥 CSV出力前の実験データ:", experimentData.experimentData);
      console.log("📝 事後アンケート回答（送信前確認）:", answers);

      // CSVファイルをダウンロード（事後アンケートの回答を直接渡して、最新の値を保証）
      console.log("📥 CSV生成開始");
      experimentData.downloadCSV(answers);
      
      setAppState("completed");
    },
    [experimentData]
  );


  const handleTaskComplete = useCallback(
    (success: boolean, taskId?: string) => {
      experimentData.recordTaskCompletion(success);
      if (taskId) {
        setCompletedTaskIds((prev) => ({ ...prev, [taskId]: success }));
        // ユーザー名変更など、実験条件に紐づくIDであれば条件を満たす
        if (Object.prototype.hasOwnProperty.call(experimentConditions, taskId)) {
          console.log(`🎯 実験タスク完了通知: ${taskId}`);
          
          // 実験タスクの終了時刻とクリック数を記録
          if (success && !experimentConditions[taskId]) {
            experimentData.endExperimentTask?.(taskId);
          }
          
          setExperimentConditions((prev) => ({ ...prev, [taskId]: success }));
        }
      }
    },
    [experimentData, experimentConditions]
  );

  if (appState === "completed") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">実験完了</h1>
          <p className="text-gray-600 mb-6">
            実験にご参加いただき、ありがとうございました。
            データは自動的にダウンロードされました。
          </p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
          >
            新しい実験を開始
          </button>
        </div>
      </div>
    );
  }

  // participantIdが生成されるまでローディング表示
  if (!participantId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg text-gray-600">読み込み中...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 事前アンケートモーダル */}
      {showPreSurvey && (
        <PreSurveyModal
          onSubmit={handlePreSurveySubmit}
        />
      )}

      {/* 事後アンケートモーダル */}
      {showPostSurvey && (
        <PostSurveyModal
          onSubmit={handlePostSurveySubmit}
          tasks={experimentTasks ?? undefined}
        />
      )}

      {/* UI生成中の読み込み画面 */}
      {isUILoading && <LoadingScreen uiConfig={uiConfig} message={loadingMessage} />}

      {/* メインコンテンツ */}
      {appState === "dashboard" && (
        <Dashboard
          uiConfig={uiConfig}
          user={user}
          onProfileClick={handleProfileClick}
          onNavigate={() => { setIsMenuOpen(true); }}
          onTasksChange={handleTasksChange}
          onTaskStatusChange={handleTaskStatusChange}
          onExperimentAction={handleExperimentAction}
        />
      )}

      <RightDrawerMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} onSelect={handleNavigate} />

      {appState === "profile" && (
        <ProfileSettings
          uiConfig={uiConfig}
          user={user}
          onBackClick={handleBackToDashboard}
          onSaveUser={handleSaveUser}
          onTaskComplete={handleTaskComplete}
        />
      )}

      {appState === "notifications" && (
        <NotificationsPage onBack={() => setAppState('dashboard')} />
      )}

      {appState === "help" && (
        <HelpPage onBack={() => setAppState('dashboard')} />
      )}

      {appState === "about" && (
        <AboutPage onBack={() => setAppState('dashboard')} />
      )}

      {/* 左端にホバーで出現するドロワー（新しいRightDrawerMenuを左側で使用） */}
      <RightDrawerMenu
        side="left"
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        widthClass="w-64"
        onPointerEnter={() => openDrawerWithDelay(0)}
        onPointerLeave={() => closeDrawerWithDelay(200)}
      >
        <div>
          <h4 className="font-bold mb-2">実験チェックリスト</h4>
          <ul className="space-y-2 text-sm">
            {Object.keys(conditionLabels).map((key) => (
              <li key={key} className="flex items-start">
                <input type="checkbox" checked={!!experimentConditions[key]} readOnly className="mr-2 mt-0.5 flex-shrink-0" />
                <div className="flex flex-col">
                  <span>{conditionLabels[key].label}</span>
                  <p className="text-xs text-gray-500">{conditionLabels[key].description}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </RightDrawerMenu>

      <div
        onPointerEnter={() => openDrawerWithDelay()}
        onPointerLeave={() => closeDrawerWithDelay()}
        className={`fixed left-0 top-0 h-full z-40 transition-all ${isDrawerOpen ? 'w-0' : 'w-6'}`}
      >
        {/* 省略: 触れるエリア */}
      </div>

      {/* デバッグ情報（開発時のみ表示） */}
      {process.env.NODE_ENV === "development" && (
        <div className="fixed bottom-4 right-4 bg-gray-800 text-white p-3 rounded-lg text-sm">
          <div>Mode: {experimentModeService.getMode()}</div>
          <div>Participant ID: {participantId}</div>
          <div>Clicks: {experimentData.clickCount}</div>
        </div>
      )}
    </div>
  );
}
