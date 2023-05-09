import vscode from 'vscode';

export class StatusBar {
  private static _instance: StatusBar;

  /** instance */
  public static get i(): StatusBar {
    if (!StatusBar._instance) {
      throw new Error('StatusBar not initialized');
    }

    return StatusBar._instance;
  }

  public static init(vscodeContext: vscode.ExtensionContext) {
    StatusBar._instance = new StatusBar(vscodeContext);
  }

  private statusBarItem: vscode.StatusBarItem;

  constructor(vscodeContext: vscode.ExtensionContext) {
    const isHiddenMode = vscodeContext.globalState.get('isHiddenMode', true);
    this.statusBarItem = vscode.window.createStatusBarItem();
    this.statusBarItem.command = 'ts-type-hidden.toogle';
    this.statusBarItem.show();
    this.changeStatus(isHiddenMode);
    vscodeContext.subscriptions.push(this.statusBarItem);
  }

  changeStatus(isHiddenMode: boolean) {
    this.statusBarItem.text = isHiddenMode ? 'TH ✅' : 'TH ❌';

    this.statusBarItem.tooltip =
      '[TS Type Hidden] - Click to toggle hidden mode (Current mode: ' +
      (isHiddenMode ? 'On' : 'Off') +
      ')';
  }
}
