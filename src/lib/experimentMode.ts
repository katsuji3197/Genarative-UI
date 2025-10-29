import { ExperimentMode } from "@/types";

export class ExperimentModeService {
  private mode: ExperimentMode;

  constructor() {
    this.mode = this.determineMode();
  }

  private determineMode(): ExperimentMode {
    // 1. URLクエリパラメータをチェック
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const modeParam = urlParams.get("mode");

      if (modeParam === "control") {
        return "control";
      } else if (modeParam === "experimental") {
        return "experimental";
      }
    }

    // 2. 環境変数をチェック
    const envMode = process.env.NEXT_PUBLIC_EXPERIMENT_MODE;
    if (envMode === "control") {
      return "control";
    } else if (envMode === "experimental") {
      return "experimental";
    }

    // 3. デフォルトは実験群
    return "experimental";
  }

  public getMode(): ExperimentMode {
    return this.mode;
  }

  public isExperimentalMode(): boolean {
    return this.mode === "experimental";
  }

  public isControlMode(): boolean {
    return this.mode === "control";
  }

  public setMode(mode: ExperimentMode): void {
    this.mode = mode;
  }

  public generateParticipantId(): string {
    const timestamp = Date.now().toString(36);
    const randomStr = Math.random().toString(36).substr(2, 5);
    const modePrefix = this.mode === "control" ? "c" : "e";
    return `${modePrefix}${timestamp}${randomStr}`;
  }
}

export const experimentModeService = new ExperimentModeService();
