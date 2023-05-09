import vscode from 'vscode';

export class GlobalState {
  private static _instance: GlobalState;

  /** instance */
  public static get i(): GlobalState {
    if (!GlobalState._instance) {
      throw new Error('GlobalState not initialized');
    }

    return GlobalState._instance;
  }

  public static init(vscodeContext: vscode.ExtensionContext) {
    GlobalState._instance = new GlobalState(vscodeContext);
  }

  private constructor(private readonly vscodeContext: vscode.ExtensionContext) {}

  get isHiddenMode() {
    return this.vscodeContext.globalState.get('isHiddenMode', true);
  }
  set isHiddenMode(value: boolean) {
    this.vscodeContext.globalState.update('isHiddenMode', value);
  }
}
