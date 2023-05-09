import vscode from 'vscode';

import { version } from '../package.json';
import { registerCommand } from './core/command';
import { Config } from './core/config';
import { EditorContext } from './core/editor-context';
import { log } from './core/log';
import { StatusBar } from './core/status-bar';
import { GlobalState } from './core/global-state';

export function activate(vscodeContext: vscode.ExtensionContext) {
  log.appendLine(`TS Type Hidden for VS Code v${version}\n`);
  if (!Config.i.get().enabled) {
    log.appendLine('Extension disabled, exiting...');

    return;
  }

  GlobalState.init(vscodeContext);
  EditorContext.init();
  StatusBar.init(vscodeContext);
  registerCommand(vscodeContext);
}
