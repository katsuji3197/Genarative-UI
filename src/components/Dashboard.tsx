"use client";

import React, { useEffect, useState, useRef } from "react";
import { PersonFillIcon } from "@primer/octicons-react";
import { UIConfig, UIConfigWithPresentation, Task } from "@/types";
import personalizationConfig from "@/config/personalization.json";
import EditTaskModal from "./EditTaskModal";
import ConfirmModal from "./ConfirmModal";
import AppButton from "./AppButton";
import { geminiService } from "@/lib/gemini";

interface DashboardProps {
  uiConfig: UIConfigWithPresentation;
  user: { name: string; email: string };
  onProfileClick: () => void;
  onNavigate?: (page: string) => void;
  onTasksChange?: (tasks: Task[]) => void;
  onTaskStatusChange?: (taskId: string, newStatus: Task["status"]) => void;
  // 実験タスク（チェックリスト）を満たしたときに親へ通知する
  onExperimentAction?: (actionKey: string) => void;
}

// 簡易ID生成
const generateId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

const DashboardComponent: React.FC<DashboardProps> = ({
  uiConfig,
  user,
  onProfileClick,
  onNavigate,
  onTasksChange,
  onTaskStatusChange,
  onExperimentAction,
}) => {
  // Inline SVG icons to avoid relying on external imports that may not render
  const PencilIconSVG = ({ size = 16 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path d="M12.146 1.854a.5.5 0 0 1 .708 0l.292.292a.5.5 0 0 1 0 .708l-9.193 9.193a.5.5 0 0 1-.168.11l-3 1a.5.5 0 0 1-.65-.65l1-3a.5.5 0 0 1 .11-.168l9.192-9.193z" fill="currentColor"/>
    </svg>
  );

  const TrashIconSVG = ({ size = 16 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path d="M6 2a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3a.5.5 0 0 1 0 1h-1v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V3H2a.5.5 0 0 1 0-1h3zM5 4v9h6V4H5z" fill="currentColor"/>
    </svg>
  );
  const [projectData, setProjectData] = useState<{ title: string; tasks: Task[] }>(() => ({
    title: "メディア情報学演習 プロジェクト",
    tasks: [
      { id: "1", title: "先行研究調査", description: "関連する論文を収集・分析", status: "completed" },
      { id: "2", title: "システム設計", description: "アーキテクチャと機能設計", status: "completed" },
      { id: "3", title: "プロトタイプ開発", description: "初期バージョンの実装", status: "in_progress" },
      { id: "4", title: "ユーザーテスト", description: "実際のユーザーでの評価", status: "in_progress" },
      { id: "5", title: "データ分析", description: "実験結果の統計分析", status: "todo" },
      { id: "6", title: "論文執筆", description: "研究成果のまとめと執筆", status: "todo" },
      { id: "7", title: "実験環境構築", description: "テスト環境のセットアップと設定", status: "completed" },
      { id: "8", title: "UIデザイン改善", description: "ユーザビリティの向上と視覚的改善", status: "in_progress" },
      { id: "9", title: "発表資料作成", description: "学会発表用のスライド準備", status: "todo" },
      { id: "10", title: "コードレビュー", description: "実装品質の確認と改善", status: "in_progress" },
    ],
  }));
  const [editingTask, setEditingTask] = useState<{ id: string; title: string; description?: string } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ open: boolean; taskId?: string }>({ open: false });
  const [addingToColumn, setAddingToColumn] = useState<Task["status"] | null>(null);
  const [presentationOverride, setPresentationOverride] = useState<Record<string, string>>({});
  const requestInFlightRef = useRef<Record<string, boolean>>({});

  // On mount, request presentation recommendation for key buttons
  useEffect(() => {
    // request only once for global presentation; per-button values (if present) are applied from response
    requestPresentationForButton();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // projectData.tasks が変わったときに親へ通知する（レンダリングフェーズでの親更新を避ける）
  useEffect(() => {
    onTasksChange?.(projectData.tasks);
  }, [projectData.tasks, onTasksChange]);

  const getTasksByStatus = (status: Task["status"]) => projectData.tasks.filter((t) => t.status === status);

  const getStatusTitle = (status: Task["status"]) => {
    switch (status) {
      case "todo":
        return "未着手";
      case "in_progress":
        return "進行中";
      case "completed":
        return "完了";
      default:
        return "";
    }
  };

  const getStatusColor = (status: Task["status"]) => {
    switch (status) {
      case "todo":
        return "bg-gray-50";
      case "in_progress":
        return "bg-blue-50";
      case "completed":
        return "bg-green-50";
      default:
        return "bg-gray-50";
    }
  };

  const getPersonalizedStyle = (component: keyof UIConfig) => {
    return (personalizationConfig as any)[component][(uiConfig as any)[component]];
  };

  const getPresentation = (buttonKey?: string) => {
    // allow runtime override from Gemini recommendation
    if (buttonKey && presentationOverride[buttonKey]) return presentationOverride[buttonKey];

    // prefer uiConfig.presentation if present
    const uiPres = (uiConfig as any).presentation;
    if (uiPres) {
      if (buttonKey && uiPres.buttons && uiPres.buttons[buttonKey]) return uiPres.buttons[buttonKey];
      if (uiPres.global) return uiPres.global;
    }

    const base = (personalizationConfig as any)["presentation"] || {};
    
    // buttonKeyが指定されている場合、そのキーの設定を確認
    if (buttonKey && base.buttons && base.buttons[buttonKey]) {
      return base.buttons[buttonKey];
    }
    
    // globalが存在する場合はそれを返す
    if (base.global) return base.global;
    
    // defaultが存在する場合はそれを返す
    if (base.default) return base.default;
    
    // 最終フォールバックとして "icon_text" を返す
    return "icon_text";
  };

  // Ask Gemini for a recommendation for a specific button (async, sets presentationOverride)
  const requestPresentationForButton = async (buttonKey?: string) => {
    const key = buttonKey ?? "default";
    // avoid duplicate concurrent requests
    if (presentationOverride[key]) return;
    if (requestInFlightRef.current[key]) {
      // eslint-disable-next-line no-console
      console.debug(`Presentation request for ${key} already in flight, skipping`);
      return;
    }

    requestInFlightRef.current[key] = true;
    try {
      const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || "";
      if (!apiKey) {
        // simple heuristic fallback
        const fallback = (uiConfig.presentation && (uiConfig.presentation as any).global) || getPresentation(buttonKey);
        setPresentationOverride((prev) => ({ ...prev, [key]: fallback }));
        return;
      }

      const answers = {
        q1_confidence: (uiConfig as any).confidence ?? 3,
        q2_preference: (uiConfig as any).preference ?? 3,
        q3_text_issue: (uiConfig as any).text ?? 3,
        q4_tap_error: (uiConfig as any).tapError ?? 3,
        q5_priority: (uiConfig as any).priority ?? 3,
        q6_icon_score: (uiConfig as any).presentation?.buttons?.iconScore ?? "3/5",
      } as any;

      const resp = await geminiService.generateUIConfig(answers);
      const pres = resp.presentation;
      if (pres) {
        const val = key && pres.buttons && pres.buttons[key] ? pres.buttons[key] : pres.global || getPresentation(buttonKey);
        setPresentationOverride((prev) => ({ ...prev, [key]: val }));
        // eslint-disable-next-line no-console
        console.info(`Gemini recommended presentation for ${key}:`, val);
      }
    } catch (e) {
      console.warn("Presentation request failed", e);
    } finally {
      requestInFlightRef.current[key] = false;
    }
  };

  const updateTaskStatus = (taskId: string, newStatus: Task["status"]) => {
    // compute next state first to avoid calling parent setState during child render
    const next = { ...projectData, tasks: projectData.tasks.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t)) };
    setProjectData(next);
    // notify parent outside of React state updater function
    onTaskStatusChange?.(taskId, newStatus);
  };

  const editTask = (taskId: string, updates: Partial<Task>) => {
    setEditingTask({ id: taskId, title: updates.title ?? '', description: updates.description ?? '' });
  };

  const deleteTask = (taskId: string) => {
    setConfirmDelete({ open: true, taskId });
  };

  const addTask = (title: string, description?: string) => {
    const newTask: Task = { id: generateId(), title, description, status: "todo" };
    setProjectData((prev) => {
      const next = { ...prev, tasks: [newTask, ...prev.tasks] };
      return next;
    });
    onExperimentAction?.("kanban_add");
  };

  const handleSaveEdit = (title: string, description?: string) => {
    if (!editingTask) return;
    const id = editingTask.id;
    setProjectData((prev) => ({ ...prev, tasks: prev.tasks.map((t) => (t.id === id ? { ...t, title, description } : t)) }));
    setEditingTask(null);
    onExperimentAction?.("kanban_edit");
  };

  const handleConfirmDelete = () => {
    const id = confirmDelete.taskId;
    if (!id) return;
    setProjectData((prev) => ({ ...prev, tasks: prev.tasks.filter((t) => t.id !== id) }));
    setConfirmDelete({ open: false });
    onExperimentAction?.("kanban_delete");
  };

  const handleCancelDelete = () => {
    setConfirmDelete({ open: false });
  };

  const handleAddToColumn = (title: string, description?: string) => {
    if (!addingToColumn) return;
    const newTask: Task = { id: generateId(), title, description, status: addingToColumn };
    setProjectData((prev) => ({ ...prev, tasks: [newTask, ...prev.tasks] }));
    setAddingToColumn(null);
    onExperimentAction?.("kanban_add");
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData("text/plain", taskId);
  };

  const handleDrop = (e: React.DragEvent, status: Task["status"]) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData("text/plain");
    if (taskId) {
      const prev = projectData.tasks.find((t) => t.id === taskId);
      if (prev && prev.status !== status) {
        updateTaskStatus(taskId, status);
        // ドラッグでのステータス変更を実験タスクとして通知
        onExperimentAction?.("kanban_drag");
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => e.preventDefault();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className={`flex items-center ${getPersonalizedStyle("layout")}`}>
              <h1 className={`font-bold text-gray-900 ${getPersonalizedStyle("text")}`}>UIパーソナライズ評価システム</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className={`text-gray-600 ${getPersonalizedStyle("text")}`}>{user.name}</span>
              {/* メニューボタン: presentation に応じて icon / text / icon_text を切替 */}
              <div className="relative">
                <AppButton variant="ghost" uiConfig={uiConfig} presentation={getPresentation('menu')} className="text-gray-600 hover:text-gray-900 transition-colors" onClick={() => onNavigate?.('menu')}>
                  {/* アイコン */}
                  {(getPresentation('menu') === 'icon' || getPresentation('menu') === 'icon_text') && (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                      <path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                  {/* テキスト */}
                  {getPresentation('menu') === 'text' || getPresentation('menu') === 'icon_text' ? 'メニュー' : <span className="sr-only">メニュー</span>}
                </AppButton>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className={`${getPersonalizedStyle("layout")}`}>
          <div className="mb-8">
            <h2 className={`font-bold text-gray-900 ${getPersonalizedStyle("text")}`}>{projectData.title}</h2>
            <p className="text-gray-600 mt-2">研究プロジェクトの進捗を管理します。タスクは「未着手」「進行中」「完了」の3つのステータスで管理されています。</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {(["todo", "in_progress", "completed"] as const).map((status) => (
              <div key={status} onDrop={(e) => handleDrop(e as any, status)} onDragOver={handleDragOver} className="bg-white rounded-lg shadow-md p-2 relative">
                <div className={`px-4 py-3 ${getStatusColor(status)} rounded-t-lg flex items-center justify-between`}>
                  <h3 className={`font-semibold text-gray-900 ${getPersonalizedStyle("text")}`}>
                    {getStatusTitle(status)}
                    <span className={`ml-2 text-sm text-gray-500 ${getPersonalizedStyle("text")}`}>({getTasksByStatus(status).length})</span>
                  </h3>
                  {/* 右上の + ボタン */}
                  <div className="flex items-center space-x-1">
                    <AppButton variant="ghost" uiConfig={uiConfig} presentation={getPresentation('addTask')} className={(personalizationConfig as any).buttonSize?.plusButton?.[(uiConfig as any).button] || ''} onClick={() => setAddingToColumn(status)}>
                      {(getPresentation('addTask') === 'icon' || getPresentation('addTask') === 'icon_text') && (
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden className="shrink-0">
                          <path d="M8 3v10M3 8h10" stroke="#000000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                      {getPresentation('addTask') === 'text' || getPresentation('addTask') === 'icon_text' ? '追加' : <span className="sr-only">追加</span>}
                    </AppButton>
                    {/* 推奨表示はコンソールに出力 (UI上の手動トグルは廃止) */}
                    {/* <div className="text-xs text-gray-400">推奨表示: {getPresentation('addTask')}</div> */}
                  </div>
                </div>
                <div className={`p-4 ${getPersonalizedStyle("layout")}`}>
                  {getTasksByStatus(status).map((task) => (
                    <div key={task.id} draggable onDragStart={(e) => handleDragStart(e, task.id)} className="bg-white border-px border-neutral-200 rounded-lg p-4 shadow hover:shadow-lg mb-3">
                      <div className="flex flex-col gap-4 justify-between items-start">
                        <div>
                          <h4 className={`font-medium text-gray-900 mb-2 ${getPersonalizedStyle("text")}`}>{task.title}</h4>
                          <p className={`text-gray-600 ${getPersonalizedStyle("text")}`}>{task.description}</p>
                        </div>
                        <div className="flex space-x-2 relative w-full justify-between items-center">
                          <span className={`${getStatusColor(task.status)} px-2 py-1 flex items-center justify-center rounded-full text-xs font-medium`}>{getStatusTitle(task.status)}</span>
                          {/* Task actions: always inline */}
                          {(() => {
                            const globalPres = getPresentation();
                            return (
                              <div className="flex gap-2">
                                <AppButton variant="ghost" uiConfig={uiConfig} presentation={globalPres} onClick={() => setEditingTask({ id: task.id, title: task.title, description: task.description })}>
                                  {(globalPres === 'icon' || globalPres === 'icon_text') && <PencilIconSVG />}
                                  {globalPres === 'text' || globalPres === 'icon_text' ? "編集" : <span className="sr-only">編集</span>}
                                </AppButton>
                                <AppButton variant="danger" uiConfig={uiConfig} presentation={globalPres} onClick={() => setConfirmDelete({ open: true, taskId: task.id })}>
                                  {(globalPres === 'icon' || globalPres === 'icon_text') && <TrashIconSVG />}
                                  {globalPres === 'text' || globalPres === 'icon_text' ? "削除" : <span className="sr-only">削除</span>}
                                </AppButton>
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* カラムごとの追加ボタンを使用するため、従来の下部追加フォームは削除 */}

        </div>
      </main>
      {/* 編集モーダル */}
      <EditTaskModal
        open={!!editingTask}
        initialTitle={editingTask?.title ?? ""}
        initialDescription={editingTask?.description}
        uiConfig={uiConfig}
        onClose={() => setEditingTask(null)}
        onSave={handleSaveEdit}
      />

      {/* 確認モーダル */}
      <ConfirmModal
        open={confirmDelete.open}
        title="タスクの削除"
        message="このタスクを本当に削除しますか？"
        uiConfig={uiConfig}
        onCancel={handleCancelDelete}
        onConfirm={handleConfirmDelete}
      />

  {/* カラム追加用モーダル */}
  <EditTaskModal
    open={!!addingToColumn}
    initialTitle=""
    initialDescription=""
    uiConfig={uiConfig}
    heading="タスクを追加"
    onClose={() => setAddingToColumn(null)}
    onSave={(title, description) => handleAddToColumn(title, description)}
  />
    </div>
  );
};

export { DashboardComponent as Dashboard };
export default DashboardComponent;
