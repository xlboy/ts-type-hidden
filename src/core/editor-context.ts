import * as vscode from 'vscode';
import type { FileInfo } from './types';
import { TypeAnalyzer, type AnalyzedType } from './helpers/type-analyzer';
import { debounce, isEqual } from 'lodash-es';

export class EditorContext {
  private static _instance: EditorContext;

  /** instance */
  public static get i(): EditorContext {
    if (!EditorContext._instance) {
      throw new Error('EditorContext not initialized');
    }

    return EditorContext._instance;
  }
  public static init(vscodeContext: vscode.ExtensionContext) {
    EditorContext._instance = new EditorContext(vscodeContext);
  }

  private files = new Map</* filePath */ string, FileInfo>();
  // TODO: 值可能是从某个本地缓存的地方拿的
  private isHiddenMode = true;
  private readonly decorationType = {
    hidden: vscode.window.createTextEditorDecorationType({
      textDecoration: 'opacity: 0; font-size: 0; display: none',
      gutterIconPath: vscode.Uri.file(`${__dirname}/../res/col-icon.svg`),
      gutterIconSize: 'contain'
    }),
    show: vscode.window.createTextEditorDecorationType({
      textDecoration: 'opacity: 1; font-size: 14px; display: inline'
      // gutterIconPath: vscode.Uri.file(`${__dirname}/../res/col-icon.svg`),
      // gutterIconSize: 'contain'
    })
  };

  private curFocusedType: AnalyzedType | undefined;

  private constructor(private readonly vscodeContext: vscode.ExtensionContext) {
    this.watch();
    this.initVisibleEditors();

    this.isHiddenMode = vscodeContext.globalState.get('isHiddenMode', true);

    if (this.isHiddenMode) this.hideType();
  }

  toggleHiddenType() {
    this.isHiddenMode = !this.isHiddenMode;
    this.isHiddenMode ? this.hideType() : this.showType();
    this.vscodeContext.globalState.update('isHiddenMode', this.isHiddenMode);
  }

  private hideType(editor = vscode.window.activeTextEditor) {
    if (editor && this.utils.isTargetDocument(editor.document)) {
      const editorInfo = this.files.get(editor.document.fileName);
      if (!editorInfo) return;

      const ranges = editorInfo.analyzedTypes
        .filter(type => !isEqual(type, this.curFocusedType))
        .map(
          type =>
            new vscode.Range(
              editor.document.positionAt(type.range.pos),
              editor.document.positionAt(type.range.end)
            )
        );

      editor.setDecorations(this.decorationType.hidden, ranges);
    }
  }

  private showType() {
    const activatedEditor = vscode.window.activeTextEditor;

    if (activatedEditor && this.utils.isTargetDocument(activatedEditor.document)) {
      const editorInfo = this.files.get(activatedEditor.document.fileName);

      if (editorInfo) {
        activatedEditor.setDecorations(this.decorationType.hidden, []);
      }
    }
  }

  private watch() {
    vscode.window.onDidChangeActiveTextEditor(editor => {
      if (this.utils.isTargetDocument(editor!.document)) {
        const filePath = editor!.document.fileName;

        if (!this.files.has(filePath)) {
          const fileCode = editor!.document.getText();
          this.files.set(filePath, {
            code: fileCode,
            analyzedTypes: new TypeAnalyzer(fileCode).analyze()
          });
        }

        if (this.isHiddenMode) this.hideType();
      }
    });

    vscode.workspace.onDidChangeTextDocument(
      debounce(event => {
        const editorInfo = this.files.get(event.document.fileName);

        if (editorInfo) {
          const newCode = event.document.getText();
          editorInfo.code = newCode;
          editorInfo.analyzedTypes = new TypeAnalyzer(newCode).analyze();

          if (this.isHiddenMode) this.hideType();
        }
      }, 1000)
    );

    vscode.window.onDidChangeTextEditorSelection(event => {
      if (this.utils.isTargetDocument(event.textEditor.document)) {
        const editorInfo = this.files.get(event.textEditor.document.fileName);

        if (editorInfo) {
          const cursorPos = event.selections[0].active;
          const cursorOffset = event.textEditor.document.offsetAt(cursorPos);
          const cursorType = editorInfo.analyzedTypes.find(
            type => {
              const start = event.textEditor.document.positionAt(type.range.pos);
              return (
                cursorPos.line === start.line ||
                (cursorOffset >= type.range.pos && cursorOffset <= type.range.end)
              );
            }
          );

          if (!isEqual(cursorType, this.curFocusedType)) {
            this.curFocusedType = cursorType;

            if (this.isHiddenMode) this.hideType();
          }
        }
      }
    });
  }

  private initVisibleEditors() {
    vscode.window.visibleTextEditors.forEach(editor => {
      if (this.utils.isTargetDocument(editor.document)) {
        const fileCode = editor.document.getText();
        this.files.set(editor.document.fileName, {
          code: fileCode,
          analyzedTypes: new TypeAnalyzer(fileCode).analyze()
        });
      }
    });
  }

  private utils = {
    isTargetDocument(document: vscode.TextDocument) {
      return (
        (document.languageId === 'typescript' ||
          document.languageId === 'typescriptreact') &&
        !document.isUntitled
      );
    }
  };
}
