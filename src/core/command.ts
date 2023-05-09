import vscode from 'vscode';

import { EditorContext } from './editor-context';
import { log } from './log';
import { GlobalState } from './global-state';
import { StatusBar } from './status-bar';

export function registerCommand(vscodeContext: vscode.ExtensionContext) {
  vscodeContext.subscriptions.push(
    vscode.commands.registerCommand('ts-type-hidden.toogle', () => {
      GlobalState.i.isHiddenMode = !GlobalState.i.isHiddenMode;
      GlobalState.i.isHiddenMode
        ? EditorContext.i.hideType(true)
        : EditorContext.i.showType();
      StatusBar.i.changeStatus(GlobalState.i.isHiddenMode);
      log.appendLine(
        `[command.toogle] Toogle hidden mode, Current mode: ${
          !GlobalState.i.isHiddenMode ? 'On' : 'Off'
        }`
      );
    }),
    vscode.commands.registerCommand('ts-type-hidden.open', () => {
      log.appendLine(`[command.open] Open hidden mode`);
      GlobalState.i.isHiddenMode = true;
      EditorContext.i.hideType(true);
      StatusBar.i.changeStatus(true);
    }),

    vscode.commands.registerCommand('ts-type-hidden.close', () => {
      log.appendLine(`[command.close] Close hidden mode`);
      GlobalState.i.isHiddenMode = false;
      EditorContext.i.showType();
      StatusBar.i.changeStatus(false);
    })
  );
}
