import type { ReadonlyDeep } from 'type-fest';
import vscode from 'vscode';
import fs from 'fs-extra';

import { log } from './log';

interface ExtensionConfig {
  /**
   * @default true
   */
  enabled: boolean;
  /**
   * @default `{$ExtensionRootPath}/res/type-icon.png`
   */
  typeIconPath: string;
}

const defaultTypeIconPath = `${__dirname}/../res/type-icon.png`;

export class Config {
  private static _instance: Config;
  /** instance */
  static get i(): Config {
    return (Config._instance ??= new Config());
  }

  get(): ReadonlyDeep<ExtensionConfig> {
    return Object.freeze(this.config);
  }

  private sync() {
    const config = vscode.workspace.getConfiguration('ts-type-hidden');

    this.config = {
      enabled: config.get('enabled', true),
      typeIconPath: config.get('typeIconPath') || defaultTypeIconPath
    } satisfies ExtensionConfig;
  }

  private config!: ExtensionConfig;
  private watchCallbacks: Array<Function> = [];

  private constructor() {
    this.sync();
    this.verify();
    this.watch();
  }

  update() {
    this.sync();
    log.appendLine(`Config updated:
${JSON.stringify(this.config, null, 2)}
`);
  }

  registerWatchCallback(fn: Function) {
    this.watchCallbacks.push(fn);
  }

  private verify() {
    if (!fs.existsSync(this.config.typeIconPath)) {
      vscode.window.showErrorMessage('`typeIconPath` is not a valid path');
      this.config.typeIconPath = defaultTypeIconPath;
    }
  }

  private watch() {
    vscode.workspace.onDidChangeConfiguration(() => {
      this.update();
      this.verify();
      this.watchCallbacks.forEach(cb => cb());
    });
  }
}
