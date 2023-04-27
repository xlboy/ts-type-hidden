import vscode from 'vscode';
import { TypeAnalyzer, type AnalyzedType } from './helpers/type-analyzer';
import { debounce, isEqual } from 'lodash-es';
import { log } from './log';

type FoldingRange = Record<'start' | 'end', /* lineNumber */ number>;

interface EditorInfo {
  code: string;
  analyzedTypes: AnalyzedType[];
  isTSX: boolean;
  foldedTypeRanges: FoldingRange[];
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

  private editors = new Map</* filePath */ string, EditorInfo>();
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

  toggleHiddenMode() {
    this.vscodeContext.globalState.update(
      'isHiddenMode',
      (this.isHiddenMode = !this.isHiddenMode)
    );
    this.isHiddenMode ? this.hideType(true) : this.showType();
    log.appendLine(
      `[command.toggleHiddenMode] ${this.isHiddenMode ? 'Hide' : 'Show'} type`
    );
  }

  async hideType(needToFold = false) {
    this.vscodeContext.globalState.update('isHiddenMode', (this.isHiddenMode = true));
    this.hideTypeProcessing = true;

    const activeEditorWindow = vscode.window.activeTextEditor;

    if (activeEditorWindow && this.utils.isTargetDocument(activeEditorWindow.document)) {
      const activeEditorInfo = this.editors.get(activeEditorWindow.document.fileName);
      if (!activeEditorInfo) return;

      const rangesToHide = activeEditorInfo.analyzedTypes
        .filter(type => !this.curFocusedTypes.some(curFType => isEqual(type, curFType)))
        .map(
          type =>
            new vscode.Range(
              activeEditorWindow.document.positionAt(type.range.pos),
              activeEditorWindow.document.positionAt(type.range.end)
            )
        );

      activeEditorWindow.setDecorations(this.decorationType.hidden, rangesToHide);

      if (needToFold) {
        handleMultiLineFold.call(this, activeEditorWindow, activeEditorInfo);
      }
    }

    this.hideTypeProcessing = false;

    return;

    async function handleMultiLineFold(
      this: EditorContext,
      activeEditorWindow: vscode.TextEditor,
      activeEditorInfo: EditorInfo
    ) {
      const curPos = activeEditorWindow.selection.active;
      activeEditorInfo.foldedTypeRanges = [];

      for await (const type of activeEditorInfo.analyzedTypes) {
        const typeRange = new vscode.Range(
          activeEditorWindow.document.positionAt(type.range.pos),
          activeEditorWindow.document.positionAt(type.range.end)
        );
        const typeText = activeEditorWindow.document.getText(typeRange);
        const typeLineCount = typeText.split('\n').length;

        if (typeLineCount > 2) {
          const inFoldingRange = (() => {
            const curFoldingRanges = this.utils.getActiveEditorFoldingRanges();

            for (const curFRange of curFoldingRanges) {
              if (
                curFRange.start <= typeRange.start.line &&
                curFRange.end >= typeRange.end.line
              ) {
                return true;
              }
            }

            return false;
          })();

          if (!inFoldingRange) {
            const lineToFold = {
              start: typeRange.start.line,
              end: typeRange.end.line + 1
            };
            activeEditorWindow.selection = new vscode.Selection(
              lineToFold.start,
              0,
              lineToFold.end,
              0
            );
            activeEditorInfo.foldedTypeRanges.push(lineToFold);
            await vscode.commands.executeCommand(
              'editor.createFoldingRangeFromSelection'
            );
          }
        }
      }

      activeEditorWindow.selection = new vscode.Selection(curPos, curPos);
      activeEditorWindow.revealRange(
        new vscode.Range(curPos.line, 0, curPos.line, 0),
        vscode.TextEditorRevealType.InCenter
      );
    }
  }

  async showType() {
    this.vscodeContext.globalState.update('isHiddenMode', (this.isHiddenMode = false));

    const activeEditor = vscode.window.activeTextEditor;

    if (activeEditor && this.utils.isTargetDocument(activeEditor.document)) {
      activeEditor.setDecorations(this.decorationType.hidden, []);

      const curEditorInfo = this.editors.get(activeEditor.document.fileName);
      if (curEditorInfo) {
        const curPos = activeEditor.selection.active;

        for await (const range of curEditorInfo.foldedTypeRanges) {
          activeEditor.selection = new vscode.Selection(range.start, 0, range.end, 0);
          await vscode.commands.executeCommand('editor.unfold');
        }

        activeEditor.selection = new vscode.Selection(curPos, curPos);
        activeEditor.revealRange(
          new vscode.Range(curPos.line, 0, curPos.line, 0),
          vscode.TextEditorRevealType.InCenter
        );
      }
    }
  }

  private register() {
    vscode.window.onDidChangeActiveTextEditor(editor => {
      if (editor && this.utils.isTargetDocument(editor.document)) {
        const filePath = editor.document.fileName;
        let isFirstOpen = false;
        if (!this.editors.has(filePath)) {
          isFirstOpen = true;
          const fileCode = editor.document.getText();
          const isTSX = editor.document.languageId === 'typescriptreact';
          this.editors.set(filePath, {
            code: fileCode,
            analyzedTypes: new TypeAnalyzer(fileCode, isTSX).analyze(),
            isTSX,
            foldedTypeRanges: []
          });
        }

        if (this.isHiddenMode) this.hideType(isFirstOpen);
      }
    });

    vscode.workspace.onDidChangeTextDocument(
      debounce<(event: vscode.TextDocumentChangeEvent) => void>(event => {
        const curChangedEditorInfo = this.editors.get(event.document.fileName);

        if (curChangedEditorInfo) {
          const newCode = event.document.getText();
          curChangedEditorInfo.code = newCode;
          curChangedEditorInfo.analyzedTypes = new TypeAnalyzer(
            newCode,
            curChangedEditorInfo.isTSX
          ).analyze();

          if (this.isHiddenMode) this.hideType();
        }
      }, 1000)
    );

    vscode.window.onDidChangeTextEditorSelection(event => {
      if (
        this.utils.isTargetDocument(event.textEditor.document) &&
        !this.hideTypeProcessing
      ) {
        const curEditorInfo = this.editors.get(event.textEditor.document.fileName);

        if (curEditorInfo) {
          const cursorPos = event.selections[0].active;
          const cursorOffset = event.textEditor.document.offsetAt(cursorPos);
          const focusedTypes = curEditorInfo.analyzedTypes.filter(type => {
            const start = event.textEditor.document.positionAt(type.range.pos);
            return (
              cursorPos.line === start.line ||
              (cursorOffset >= type.range.pos && cursorOffset <= type.range.end)
            );
          });

          if (!isEqual(focusedTypes, this.curFocusedTypes)) {
            this.curFocusedTypes = focusedTypes;
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
        const isTSX = editor.document.languageId === 'typescriptreact';
        this.editors.set(editor.document.fileName, {
          code: fileCode,
          analyzedTypes: new TypeAnalyzer(fileCode, isTSX).analyze(),
          isTSX,
          foldedTypeRanges: []
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
    getActiveEditorFoldingRanges(): FoldingRange[] {
      const activeEditor = vscode.window.activeTextEditor;
      if (!activeEditor) return [];

      const foldingRanges: FoldingRange[] = [];

      // `[[0, 11], [25, 44]]`, get `[11, 25]`
      activeEditor.visibleRanges.forEach((range, index, visibleRanges) => {
        if (visibleRanges.length === 1 || index === visibleRanges.length - 1) return;

        const endLine = range.end.line;
        const nextStartLine = visibleRanges[index + 1]!.start.line;

        foldingRanges.push({ start: endLine, end: nextStartLine });
      });

      return foldingRanges;
    }
  };
}
