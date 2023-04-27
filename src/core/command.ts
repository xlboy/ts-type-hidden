import vscode from 'vscode';

import { log } from './log';
import { EditorContext } from './editor-context';

export function registerCommand(vscodeContext: vscode.ExtensionContext) {
  vscodeContext.subscriptions.push(
    vscode.commands.registerCommand('ts-type-hidden.toggleHiddenMode', () => {
      EditorContext.i.toggleHiddenMode();
    })
  );
}
