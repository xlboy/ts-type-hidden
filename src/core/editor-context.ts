import * as vscode from 'vscode';
import { TypeAnalyzer, type AnalyzedType } from './helpers/type-analyzer';
import { debounce, isEqual } from 'lodash-es';

interface FileInfo {
  code: string;
  analyzedTypes: AnalyzedType[];
}

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
  private isHiddenMode = true;
  private readonly decorationType = {
    hidden: vscode.window.createTextEditorDecorationType({
      textDecoration: 'opacity: 0; font-size: 0; display: none',
      gutterIconPath: vscode.Uri.file(`${__dirname}/../res/col-icon.svg`),
      gutterIconSize: 'contain'
    })
  };
  private curFocusedTypes: AnalyzedType[] = [];
  private hideTypeProcessing = false;

  private constructor(private readonly vscodeContext: vscode.ExtensionContext) {
    this.register();
    this.initVisibleEditors();

    this.isHiddenMode = vscodeContext.globalState.get('isHiddenMode', true);

    if (this.isHiddenMode) this.hideType(true);
  }

  toggleHiddenType() {
    this.isHiddenMode = !this.isHiddenMode;
    this.isHiddenMode ? this.hideType(true) : this.showType();
    this.vscodeContext.globalState.update('isHiddenMode', this.isHiddenMode);
  }

  private async hideType(isFirstActivate = false) {
    const activeEditor = vscode.window.activeTextEditor;

    this.hideTypeProcessing = true;

    if (activeEditor && this.utils.isTargetDocument(activeEditor.document)) {
      const editorInfo = this.files.get(activeEditor.document.fileName);
      if (!editorInfo) return;

      const ranges = editorInfo.analyzedTypes
        .filter(type => !this.curFocusedTypes.some(curFType => isEqual(type, curFType)))
        .map(
          type =>
            new vscode.Range(
              activeEditor.document.positionAt(type.range.pos),
              activeEditor.document.positionAt(type.range.end)
            )
        );

      activeEditor.setDecorations(this.decorationType.hidden, ranges);

      if (isFirstActivate) {
        // 记录当前光标所在的位置
        const curPos = activeEditor.selection.active;
        // 记录当前滚动条的位置
        const curScrollPos = activeEditor.visibleRanges[0].start.line;

        for await (const type of editorInfo.analyzedTypes) {
          const range = new vscode.Range(
            activeEditor.document.positionAt(type.range.pos),
            activeEditor.document.positionAt(type.range.end)
          );
          const text = activeEditor.document.getText(range);
          const lineCount = text.split('\n').length;

          if (lineCount > 2) {
            activeEditor.selection = new vscode.Selection(
              range.start.line,
              0,
              range.end.line + 1,
              0
            );
            await vscode.commands.executeCommand(
              'editor.createFoldingRangeFromSelection'
            );
          }
        }

        activeEditor.selection = new vscode.Selection(curPos, curPos);
        activeEditor.revealRange(new vscode.Range(curScrollPos, 0, curScrollPos, 0));
      }
    }
    this.hideTypeProcessing = false;
  }

  private showType() {
    const activeEditor = vscode.window.activeTextEditor;

    if (activeEditor && this.utils.isTargetDocument(activeEditor.document)) {
      const editorInfo = this.files.get(activeEditor.document.fileName);

      if (editorInfo) {
        activeEditor.setDecorations(this.decorationType.hidden, []);
      }
    }
  }

  private register() {
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

        if (this.isHiddenMode) this.hideType(true);
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
      if (
        this.utils.isTargetDocument(event.textEditor.document) &&
        !this.hideTypeProcessing
      ) {
        const editorInfo = this.files.get(event.textEditor.document.fileName);

        if (editorInfo) {
          const cursorPos = event.selections[0].active;
          const cursorOffset = event.textEditor.document.offsetAt(cursorPos);
          const cursorTypes = editorInfo.analyzedTypes.filter(type => {
            const start = event.textEditor.document.positionAt(type.range.pos);
            return (
              cursorPos.line === start.line ||
              (cursorOffset >= type.range.pos && cursorOffset <= type.range.end)
            );
          });

          if (!isEqual(cursorTypes, this.curFocusedTypes)) {
            this.curFocusedTypes = cursorTypes;
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
        !document.isUntitled &&
        !document.fileName.endsWith('.d.ts')
      );
    },
    getCurEditorFoldedRanges() {
      const activeEditor = vscode.window.activeTextEditor;
      if (activeEditor) {
      }
      return [];
    }
  };
}
