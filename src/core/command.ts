import vscode from 'vscode';

import { EditorContext } from './editor-context';
import { log } from './log';

export function registerCommand(vscodeContext: vscode.ExtensionContext) {
  vscodeContext.subscriptions.push(
    vscode.commands.registerCommand('ts-type-hidden.toogle', () => {
      EditorContext.i.toggleHiddenMode();
    }),
    vscode.commands.registerCommand('ts-type-hidden.open', () => {
      log.appendLine(`[command.open] Open hidden mode`)
      EditorContext.i.hideType(true);
    }),

    vscode.commands.registerCommand('ts-type-hidden.close', () => {
      log.appendLine(`[command.close] Close hidden mode`)
      EditorContext.i.showType();
    })
  );
}
