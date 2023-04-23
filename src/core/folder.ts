import * as vscode from 'vscode';

export class Folder {
  private static _instance: Folder;

  /** instance */
  public static get i(): Folder {
    if (!Folder._instance) {
      throw new Error('Folder not initialized');
    }

    return Folder._instance;
  }

  public static init() {
    Folder._instance = new Folder();
  }

  private constructor() {}
}
