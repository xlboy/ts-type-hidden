import vscode from 'vscode';

import { EditorContext } from './editor-context';
import { log } from './log';

export function registerCommand(vscodeContext: vscode.ExtensionContext) {
  vscodeContext.subscriptions.push(
    vscode.commands.registerCommand('ts-type-hidden.toggleHiddenMode', () => {
      EditorContext.i.toggleHiddenMode();
    }),
    vscode.commands.registerCommand('ts-type-hidden.hideType', () => {
      log.appendLine(`[command.hideType] Hide type`)
      EditorContext.i.hideType(true);
    }),

    vscode.commands.registerCommand('ts-type-hidden.showType', () => {
      log.appendLine(`[command.showType] Show type`)
      EditorContext.i.showType();
    })
  );
}
