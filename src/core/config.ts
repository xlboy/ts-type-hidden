import type { ReadonlyDeep } from 'type-fest';
import vscode from 'vscode';

import { log } from './log';

interface ExtensionConfig {
  /**
   * @default true
   */
  enabled: boolean;
}

export class Config {
  private static _instance: Config;
  /** instance */
  static get i(): Config {
    return (Config._instance ??= new Config());
  }

  private config!: ExtensionConfig;

  private constructor() {
    this.init();
    this.watch();
  }

  update() {
    this.init();
    log.appendLine(`Config updated:
${JSON.stringify(this.config, null, 2)}
`);
  }

  get(): ReadonlyDeep<ExtensionConfig> {
    return this.config;
  }

  private init() {
    const config = vscode.workspace.getConfiguration('ts-type-hidden');

    this.config = Object.freeze<ExtensionConfig>({
      enabled: config.get('enabled', true)
    });
  }

  private watch() {
    vscode.workspace.onDidChangeConfiguration(() => {
      this.update();
    });
  }
}
