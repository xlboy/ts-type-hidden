import * as vscode from 'vscode';
import type { FileInfo } from './types';

export class EditorContext {
  private static _instance: EditorContext;

  /** instance */
  public static get i(): EditorContext {
    if (!EditorContext._instance) {
      throw new Error('EditorContext not initialized');
    }

    return EditorContext._instance;
  }
  public static init() {
    EditorContext._instance = new EditorContext();
  }

  private files = new Map</* filePath */ string, FileInfo>();
  // TODO: 值可能是从某个本地缓存的地方拿的
  private isHiddenMode = true;

  private constructor() {
    this.watch();
    this.initVisibleEditors();
  }

  toggleHiddenType() {
    this.isHiddenMode = !this.isHiddenMode;
    this.isHiddenMode ? this.hideType() : this.showType();
  }

  private hideType(editor = vscode.window.activeTextEditor) {
    if (editor && this.utils.isTargetDocument(editor.document)) {
      const editorInfo = this.files.get(editor.document.fileName);

      if (editorInfo) {
        const decorationType = vscode.window.createTextEditorDecorationType({
          textDecoration: 'opacity: 0; font-size: 0; display: none'
        });

        const startPos = new vscode.Position(1, 0);
        const endPos = new vscode.Position(4, 10);
        const range = new vscode.Range(startPos, endPos);

        const decorationOptions: vscode.DecorationOptions = { range };
        editor.setDecorations(decorationType, [decorationOptions]);
      }
    }
  }

  private showType() {
    const activatedEditor = vscode.window.activeTextEditor;

    if (activatedEditor && this.utils.isTargetDocument(activatedEditor.document)) {
      const editorInfo = this.files.get(activatedEditor.document.fileName);

      if (editorInfo) {
        const { code, analyzedTypeInfos } = editorInfo;
        const { document } = activatedEditor;
        const { fileName } = document;
      }
    }
  }

  private watch() {
    vscode.window.onDidChangeActiveTextEditor(editor => {
      if (this.utils.isTargetDocument(editor!.document)) {
        const filePath = editor!.document.fileName;

        if (!this.files.has(filePath)) {
          this.files.set(filePath, {
            code: editor!.document.getText(),
            analyzedTypeInfos: []
          });
        }

        if (this.isHiddenMode) this.hideType();
      }
    });

    vscode.workspace.onDidChangeTextDocument(event => {
      const editorInfo = this.files.get(event.document.fileName);

      if (editorInfo) {
        const newCode = event.document.getText();
        editorInfo.code = newCode;
        console.log('发生改变啦： ' + event.document.fileName);
      }
    });
  }

  private initVisibleEditors() {
    vscode.window.visibleTextEditors.forEach(editor => {
      if (this.utils.isTargetDocument(editor.document)) {
        this.files.set(editor.document.fileName, {
          code: editor.document.getText(),
          analyzedTypeInfos: []
        });
      }
    });
  }

  private utils = {
    isTargetDocument(document: vscode.TextDocument) {
      return document.languageId === 'typescript' && !document.isUntitled;
    }
  };
}
