import vscode from 'vscode';
import { type AnalyzedType, TypeAnalyzer } from './helpers/type-analyzer';
import { debounce, isEqual } from 'lodash-es';
import { GlobalState } from './global-state';
import { Config } from './config';

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
  public static init() {
    EditorContext._instance = new EditorContext();
  }

  private editors = new Map</* filePath */ string, EditorInfo>();
  private curFocusedTypes: AnalyzedType[] = [];

  private constructor() {
    this.register();
    this.initVisibleEditors();
    this.decoration.init();
    Config.i.registerWatchCallback(this.decoration.refreshIcon);

    if (GlobalState.i.isHiddenMode) this.hideType(true);
  }

  hideType(needToFold = false) {
    const activeEditorWindow = vscode.window.activeTextEditor;

    if (activeEditorWindow && this.utils.isTargetDocument(activeEditorWindow.document)) {
      const activeEditorInfo = this.editors.get(activeEditorWindow.document.fileName);
      if (!activeEditorInfo) return;

      const filteredAnalyzedTypes = activeEditorInfo.analyzedTypes
        .filter(type => !Config.i.get().ignoreTypeKinds.includes(type.kind))
        .filter(type => !this.curFocusedTypes.some(curFType => isEqual(type, curFType)));
      const typeRangesToHide = filteredAnalyzedTypes.map(
        type =>
          new vscode.Range(
            activeEditorWindow.document.positionAt(type.range.pos),
            activeEditorWindow.document.positionAt(type.range.end)
          )
      );

      activeEditorWindow.setDecorations(this.decoration.get().hidden, typeRangesToHide);
      activeEditorWindow.setDecorations(this.decoration.get().icon, typeRangesToHide);

      if (needToFold) {
        setTimeout(() => {
          handleMultiLineFold.call(this, activeEditorWindow, activeEditorInfo);
        }, 200);
        // Q：↑为什么需要 200ms 延时？
        // A：在初次打开文件时，执行了相关代码后走到此方法内时，获取到的 `currentCursorPos` 是不正确的“头位置”
        // A：为什么是头位置？猜测是未初始化好等原因，因而没能及时将光标位置同步到 `selection.active` 中…
      }
    }

    return;

    async function handleMultiLineFold(
      this: EditorContext,
      activeEditorWindow: vscode.TextEditor,
      activeEditorInfo: EditorInfo
    ) {
      const currentCursorPos = activeEditorWindow.selection.active;
      const filteredAnalyzedTypes = activeEditorInfo.analyzedTypes.filter(
        type => !Config.i.get().ignoreTypeKinds.includes(type.kind)
      );
      let foldedCount = 0;
      activeEditorInfo.foldedTypeRanges = [];

      for await (const type of filteredAnalyzedTypes) {
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
            foldedCount++;
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

      if (foldedCount > 0) {
        activeEditorWindow.selection = new vscode.Selection(
          currentCursorPos,
          currentCursorPos
        );
        activeEditorWindow.revealRange(
          new vscode.Range(currentCursorPos.line, 0, currentCursorPos.line, 0),
          vscode.TextEditorRevealType.InCenter
        );
      }
    }
  }

  async showType() {
    const activeEditorWindow = vscode.window.activeTextEditor;

    if (activeEditorWindow && this.utils.isTargetDocument(activeEditorWindow.document)) {
      activeEditorWindow.setDecorations(this.decoration.get().hidden, []);
      activeEditorWindow.setDecorations(this.decoration.get().icon, []);

      const curEditorInfo = this.editors.get(activeEditorWindow.document.fileName);
      if (curEditorInfo) {
        const curPos = activeEditorWindow.selection.active;

        for await (const range of curEditorInfo.foldedTypeRanges) {
          activeEditorWindow.selection = new vscode.Selection(
            range.start,
            0,
            range.end,
            0
          );
          await vscode.commands.executeCommand('editor.unfold');
        }

        activeEditorWindow.selection = new vscode.Selection(curPos, curPos);
        activeEditorWindow.revealRange(
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

        if (GlobalState.i.isHiddenMode) this.hideType(isFirstOpen);
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
          this.curFocusedTypes = this.getActiveEditorFocusedTypes();

          if (GlobalState.i.isHiddenMode) this.hideType();
        }
      }, 1000)
    );

    vscode.window.onDidChangeTextEditorSelection(event => {
      if (this.utils.isTargetDocument(event.textEditor.document)) {
        const curEditorInfo = this.editors.get(event.textEditor.document.fileName);
        if (!curEditorInfo) return;

        const focusedTypes = this.getActiveEditorFocusedTypes();
        if (!isEqual(focusedTypes, this.curFocusedTypes)) {
          this.curFocusedTypes = focusedTypes;

          const cursorPositionUpdateOnly =
            curEditorInfo.code === event.textEditor.document.getText();
          if (cursorPositionUpdateOnly && GlobalState.i.isHiddenMode) {
            this.hideType();
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

  private getActiveEditorFocusedTypes() {
    const activeEditorWindow = vscode.window.activeTextEditor;
    if (!activeEditorWindow) return [];

    const curEditrInfo = this.editors.get(activeEditorWindow.document.fileName);
    if (!curEditrInfo) return [];

    const cursorPos = activeEditorWindow.selection.active;
    const cursorOffset = activeEditorWindow.document.offsetAt(cursorPos);
    const focusedTypes = curEditrInfo.analyzedTypes.filter(type => {
      const start = activeEditorWindow.document.positionAt(type.range.pos);
      return (
        cursorPos.line === start.line ||
        (cursorOffset >= type.range.pos && cursorOffset <= type.range.end)
      );
    });

    return focusedTypes;
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
      const activeEditorWindow = vscode.window.activeTextEditor;
      if (!activeEditorWindow) return [];

      const foldingRanges: FoldingRange[] = [];

      // `[[0, 11], [25, 44]]`, get `[11, 25]`
      activeEditorWindow.visibleRanges.forEach((range, index, visibleRanges) => {
        if (visibleRanges.length === 1 || index === visibleRanges.length - 1) return;

        const endLine = range.end.line;
        const nextStartLine = visibleRanges[index + 1]!.start.line;

        foldingRanges.push({ start: endLine, end: nextStartLine });
      });

      return foldingRanges;
    }
  };

  private decoration = (() => {
    let value: Record<'hidden' | 'icon', vscode.TextEditorDecorationType>;

    const createIcon = () =>
      vscode.window.createTextEditorDecorationType({
        gutterIconPath: vscode.Uri.file(Config.i.get().typeIconPath),
        gutterIconSize: 'contain'
      });

    return {
      get: () => value,
      refreshIcon() {
        value.icon.dispose();
        value.icon = createIcon();
      },
      init() {
        value = {
          hidden: vscode.window.createTextEditorDecorationType({
            textDecoration: 'opacity: 0; font-size: 0; display: none'
          }),
          icon: createIcon()
        };
      }
    };
  })();
}
