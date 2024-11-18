import { isEqual } from 'lodash-es';
import ts from 'typescript';
import { TYPE_KIND } from './constants';

export interface AnalyzedType {
  kind: TYPE_KIND;
  range: ts.TextRange;
  text: string;
}

export class TypeAnalyzer {
  public sourceFile: ts.SourceFile;
  public analyzedTypes: AnalyzedType[] = [];

  constructor(code: string, isTSX = false) {
    this.sourceFile = ts.createSourceFile(
      `temp.ts${isTSX ? 'x' : ''}`,
      code,
      ts.ScriptTarget.Latest,
      true,
      isTSX ? ts.ScriptKind.TSX : ts.ScriptKind.TS
    );
  }

  analyze() {
    this.visit(this.sourceFile, null);
    this.cleanAnalyzedTypes();

    return this.analyzedTypes;
  }

  private cleanAnalyzedTypes() {
    clearUselessTypes.call(this);
    clearLineBreakOfStartOrEnd.call(this);

    return;

    function clearLineBreakOfStartOrEnd(this: TypeAnalyzer) {
      this.analyzedTypes.forEach(type => {
        const oldTextLength = type.text.length;

        type.text = type.text.replace(/^[\r\n]+/, '');
        const startLineBreakCount = oldTextLength - type.text.length;

        type.text = type.text.replace(/[\r\n]+$/, '');
        const endLineBreakCount = oldTextLength - startLineBreakCount - type.text.length;

        type.range.pos += startLineBreakCount;
        type.range.end -= endLineBreakCount;
      });
    }

    // [1]. `declare const a: number`, [2]. `: number`. remove [2]
    function clearUselessTypes(this: TypeAnalyzer) {
      const indexsToRemove = new Set<number>();
      this.analyzedTypes.forEach((type, index) => {
        if (indexsToRemove.has(index)) return;

        this.analyzedTypes.forEach((_type, _index) => {
          if (index === _index || indexsToRemove.has(_index)) return;

          if (isEqual(_type, type)) return indexsToRemove.add(index);

          if (type.range.pos >= _type.range.pos) {
            if (type.range.end < _type.range.end) indexsToRemove.add(index);
          }
        });
      });

      const sortedToRemoveIndexs = Array.from(indexsToRemove).sort((a, b) => b - a);
      sortedToRemoveIndexs.forEach(index => this.analyzedTypes.splice(index, 1));
    }
  }

  private visit(node: ts.Node, parent: ts.Node | null) {
    if (
      ts.isTypeNode(node) ||
      ts.isTypeElement(node) ||
      ts.isTypeOfExpression(node) ||
      ts.isTypeOperatorNode(node) ||
      ts.isTypeParameterDeclaration(node) ||
      ts.isTypePredicateNode(node) ||
      ts.isTypeQueryNode(node) ||
      ts.isTypeReferenceNode(node) ||
      ts.isTypeAliasDeclaration(node) ||
      ts.isInterfaceDeclaration(node) ||
      ts.isTypeLiteralNode(node) ||
      ts.isVariableStatement(node) ||
      ts.isClassDeclaration(node) ||
      ts.isModuleDeclaration(node) ||
      ts.isEnumDeclaration(node) ||
      ts.isTypeOnlyImportOrExportDeclaration(node) ||
      ts.isExportDeclaration(node)
    ) {
      if (parent) {
        this.handleDifferentNode(parent!, node);
      } else {
        console.error('[Error]: parent is null');
      }
    } else {
      ts.forEachChild(node, child => this.visit(child, node));
    }
  }

  private handleDifferentNode(parent: ts.Node, child: ts.Node) {
    type NodeHandlers = Partial<Record<ts.SyntaxKind, Function>>;
    const parentNodeHandlers: NodeHandlers = {
      [ts.SyntaxKind.FunctionDeclaration]: handleParentFunction.bind(this),
      [ts.SyntaxKind.MethodDeclaration]: handleParentFunction.bind(this),
      [ts.SyntaxKind.FunctionExpression]: handleParentFunction.bind(this),
      [ts.SyntaxKind.ArrowFunction]: handleParentFunction.bind(this),
      [ts.SyntaxKind.GetAccessor]: handleParentFunction.bind(this),
      [ts.SyntaxKind.ClassDeclaration]: handleParentClassDeclaration.bind(this),
      [ts.SyntaxKind.Parameter]: handleParentParameter.bind(this),
      [ts.SyntaxKind.VariableDeclaration]: handleParentVariableDeclaration.bind(this),
      [ts.SyntaxKind.AsExpression]: handleParentAsOrSatisfiesExpr.bind(this),
      [ts.SyntaxKind.SatisfiesExpression]: handleParentAsOrSatisfiesExpr.bind(this),
      [ts.SyntaxKind.TypeAssertionExpression]: handleParentTypeAssertionExpr.bind(this),
      [ts.SyntaxKind.CallExpression]: handleParentCallOrNewExpr.bind(this),
      [ts.SyntaxKind.NewExpression]: handleParentCallOrNewExpr.bind(this),
      [ts.SyntaxKind.PropertyDeclaration]: handleParentPropertyDeclaration.bind(this),
      [ts.SyntaxKind.JsxSelfClosingElement]: handleParentJsxElement.bind(this),
      [ts.SyntaxKind.ImportDeclaration]: handleParentImportOrExportDeclaration.bind(this) // import type
    };

    const childNodeHandlers: NodeHandlers = {
      [ts.SyntaxKind.InterfaceDeclaration]: handleChildInterfaceOrTypeAlias.bind(this),
      [ts.SyntaxKind.TypeAliasDeclaration]: handleChildInterfaceOrTypeAlias.bind(this),
      [ts.SyntaxKind.VariableStatement]: handleChildDeclareStatement.bind(this),
      [ts.SyntaxKind.ClassDeclaration]: handleChildDeclareStatement.bind(this),
      [ts.SyntaxKind.ModuleDeclaration]: handleChildDeclareStatement.bind(this),
      [ts.SyntaxKind.EnumDeclaration]: handleChildDeclareStatement.bind(this),
      [ts.SyntaxKind.GetAccessor]: handleChildGetOrSetAccessor.bind(this),
      [ts.SyntaxKind.SetAccessor]: handleChildGetOrSetAccessor.bind(this),
      [ts.SyntaxKind.ImportSpecifier]: handleImportOrExportSpecifier.bind(this), // import {type}
      [ts.SyntaxKind.ExportSpecifier]: handleImportOrExportSpecifier.bind(this), // export {type}
      [ts.SyntaxKind.ExportDeclaration]: handleParentImportOrExportDeclaration.bind(this) // export type {}
    };

    parentNodeHandlers[parent.kind]?.(parent, child);
    childNodeHandlers[child.kind]?.(child);

    return;

    // [tsx] context: `<Component<number, string> .../>`, get `<number, string>`
    function handleParentJsxElement(
      this: TypeAnalyzer,
      parent: ts.JsxSelfClosingElement,
      curChild: ts.Node
    ) {
      if (parent.typeArguments && parent.typeArguments.length > 0) {
        const children = parent.getChildren(this.sourceFile);
        const startIndex = children.findIndex(
          child => child.pos === parent.typeArguments![0].pos
        );
        const endIndex = children.findIndex(
          child => child.pos === parent.typeArguments!.at(-1)!.end
        );
        // <
        const prevNode = children[startIndex - 1];
        // >
        const nextNode = children[endIndex + 1];
        return this.pushAnalyzedType(TYPE_KIND.TSX_COMPONENT_GENERIC, [
          prevNode.end - 1,
          nextNode.pos
        ]);
      }
    }
    // [class] context: `class A { a?: number }`, get `?: number`
    function handleParentPropertyDeclaration(
      this: TypeAnalyzer,
      parent: ts.PropertyDeclaration,
      curChild: ts.Node
    ) {
      if (curChild === parent.type) {
        const children = parent.getChildren(this.sourceFile);
        const index = children.findIndex(child => child.pos === parent.type!.pos);
        // :
        const prevNode = children[index - 1];
        // ? or !
        const operatorNode = children[index - 2];
        const hasOperatorNode = [
          ts.SyntaxKind.QuestionToken,
          ts.SyntaxKind.ExclamationToken
        ].includes(operatorNode.kind);
        return this.pushAnalyzedType(TYPE_KIND.CLASS_PROPERTY_TYPE_DEFINITION, [
          hasOperatorNode ? operatorNode.end - 1 : prevNode.end - 1,
          parent.type!.end
        ]);
      }
    }

    // parent = `fn<number>()` | `new fn<number>()`, get `<number>`(typeArguments)
    function handleParentCallOrNewExpr(
      this: TypeAnalyzer,
      parent: ts.CallExpression | ts.NewExpression,
      curChild: ts.Node
    ) {
      if (parent.typeArguments && parent.typeArguments.length > 0) {
        const children = parent.getChildren(this.sourceFile);

        const startIndex = children.findIndex(
          child => child.pos === parent.typeArguments![0].pos
        );
        const endIndex = children.findIndex(
          child => child.end === parent.typeArguments!.at(-1)!.end
        );
        // <
        const prevNode = children[startIndex - 1];
        // >
        const nextNode = children[endIndex + 1];
        return this.pushAnalyzedType(TYPE_KIND.FUNCTION_CALL_GENERIC, [
          prevNode.end - 1,
          nextNode.pos + 1
        ]);
      }
    }

    // context: `<number>a`, get `<number>`
    function handleParentTypeAssertionExpr(
      this: TypeAnalyzer,
      parent: ts.TypeAssertion,
      curChild: ts.Node
    ) {
      const children = parent.getChildren(this.sourceFile);
      const index = children.findIndex(
        child => child.pos === curChild.pos && child.end === curChild.end
      );
      // <
      const prevNode = children[index - 1];
      // >
      const nextNode = children[index + 1];

      return this.pushAnalyzedType(TYPE_KIND.ANGLE_BRACKETS_ASSERTION, [
        prevNode.end - 1,
        nextNode.pos + 1
      ]);
    }

    // context = `a as number` | `a satisfies number`, curChild = `number`
    function handleParentAsOrSatisfiesExpr(
      this: TypeAnalyzer,
      parent: ts.AsExpression | ts.SatisfiesExpression,
      curChild: ts.Node
    ) {
      const children = parent.getChildren(this.sourceFile);
      const index = children.findIndex(
        child => child.pos === curChild.pos && child.end === curChild.end
      );
      // as, satisfies
      const prevNode = children[index - 1];
      const kind =
        prevNode.kind === ts.SyntaxKind.AsKeyword
          ? TYPE_KIND.AS_ASSERTION
          : TYPE_KIND.SATISFIES_OPERATOR;

      return this.pushAnalyzedType(kind, [prevNode.pos, curChild.end]);
    }

    // VariableStatement, ClassDeclaration, ModuleDeclaration, EnumDeclaration
    function handleChildDeclareStatement(
      this: TypeAnalyzer,
      child:
        | ts.VariableStatement
        | ts.ClassDeclaration
        | ts.ModuleDeclaration
        | ts.EnumDeclaration
    ) {
      const hasDeclareKeyword = child.modifiers?.some(
        modifier => modifier.kind === ts.SyntaxKind.DeclareKeyword
      );

      if (hasDeclareKeyword) {
        this.pushAnalyzedType(TYPE_KIND.DECLARE_STATEMENT, [child.pos, child.end]);
      } else {
        ts.forEachChild(child, _child => this.visit(_child, child));
      }
    }

    // context = `const a: number`, curChild = `number`, get `: number`
    function handleParentVariableDeclaration(
      this: TypeAnalyzer,
      parent: ts.VariableDeclaration,
      curChild: ts.Node
    ) {
      const children = parent.getChildren(this.sourceFile);
      const index = children.findIndex(
        child => child.pos === curChild.pos && child.end === curChild.end
      );
      // :
      const prevNode = children[index - 1];
      // !
      const operatorNode = children[index - 2];
      const hasOperatorNode = operatorNode.kind === ts.SyntaxKind.ExclamationToken;
      this.pushAnalyzedType(TYPE_KIND.VARIABLE_TYPE_DEFINITION, [
        hasOperatorNode ? operatorNode.end - 1 : prevNode.end - 1,
        curChild.end
      ]);
    }

    function handleChildGetOrSetAccessor(
      this: TypeAnalyzer,
      curChild: ts.GetAccessorDeclaration | ts.SetAccessorDeclaration
    ) {
      ts.forEachChild(curChild, _child => this.visit(_child, curChild));
    }

    function handleChildInterfaceOrTypeAlias(
      this: TypeAnalyzer,
      child: ts.InterfaceDeclaration | ts.TypeAliasDeclaration
    ) {
      const kind =
        child.kind === ts.SyntaxKind.InterfaceDeclaration
          ? TYPE_KIND.INTERFACE
          : TYPE_KIND.TYPE_ALIAS;
      this.pushAnalyzedType(kind, [child.pos, child.end]);
    }

    // context = `a: number`, curChild = `number`
    function handleParentParameter(
      this: TypeAnalyzer,
      parent: ts.ParameterDeclaration,
      curChild: ts.Node
    ) {
      const children = parent.getChildren(this.sourceFile);
      const index = children.findIndex(
        child => child.pos === curChild.pos && child.end === curChild.end
      );
      // :
      const prevNode = children[index - 1];
      // ?
      const optionalNode = children[index - 2];
      const hasOptionalNode = optionalNode.kind === ts.SyntaxKind.QuestionToken;

      this.pushAnalyzedType(TYPE_KIND.FUNCTION_PARAMETER, [
        hasOptionalNode ? optionalNode.pos : prevNode.pos,
        curChild.end
      ]);
    }

    function handleParentClassDeclaration(
      this: TypeAnalyzer,
      parent: ts.ClassDeclaration,
      curChild: ts.Node
    ) {
      if (ts.isTypeParameterDeclaration(curChild) && parent.typeParameters) {
        const children = parent.getChildren(this.sourceFile);
        // children.slice(startIndex, endIndex) = B extends 222, C extends ...
        const startIndex = children.findIndex(
          child => child.pos === parent.typeParameters!.pos
        );
        const endIndex = children.findIndex(
          child => child.end === parent.typeParameters!.end
        );
        // <
        const prevNode = children[startIndex - 1];
        // >
        const nextNode = children[endIndex + 1];
        return this.pushAnalyzedType(TYPE_KIND.FUNCTION_GENERIC_DEFINITION, [
          prevNode.end - 1,
          nextNode.pos + 1
        ]);
      }
    }

    // FunctionDeclaration | MethodDeclaration | FunctionExpression
    function handleParentFunction(
      this: TypeAnalyzer,
      parent: ts.FunctionDeclaration | ts.MethodDeclaration | ts.FunctionExpression,
      curChild: ts.Node
    ) {
      const hasDeclareKeyword = parent.modifiers?.some(
        modifier => modifier.kind === ts.SyntaxKind.DeclareKeyword
      );
      if (hasDeclareKeyword) {
        return this.pushAnalyzedType(TYPE_KIND.DECLARE_STATEMENT, [
          parent.pos,
          parent.end
        ]);
      }

      // function a<B extends 222>(test: ...): void;
      const isOverload = parent.body === undefined;
      if (isOverload) {
        // public a<B extends 222>(test: ...): void;
        if (ts.isMethodDeclaration(parent)) {
          let startPos = parent.name.end;
          if (parent.modifiers && parent.modifiers.length > 0) {
            startPos = parent.modifiers[0].pos;
          }
          return this.pushAnalyzedType(TYPE_KIND.FUNCTION_OVERLOAD, [
            startPos,
            parent.end
          ]);
        } else {
          return this.pushAnalyzedType(TYPE_KIND.FUNCTION_OVERLOAD, [
            parent.pos,
            parent.end
          ]);
        }
      }

      const children = parent.getChildren(this.sourceFile);
      const index = children.findIndex(
        child => child.pos === curChild.pos && child.end === curChild.end
      );

      // ↓↓ function a<B extends 222>(test: ...) { ... } ↓↓
      if (ts.isTypeParameterDeclaration(curChild) && parent.typeParameters) {
        // children.slice(startIndex, endIndex) = B extends 222, C extends ...
        const startIndex = children.findIndex(
          child => child.pos === parent.typeParameters!.pos
        );
        const endIndex = children.findIndex(
          child => child.end === parent.typeParameters!.end
        );
        // <
        const prevNode = children[startIndex - 1];
        // >
        const nextNode = children[endIndex + 1];
        return this.pushAnalyzedType(TYPE_KIND.FUNCTION_GENERIC_DEFINITION, [
          prevNode.end - 1,
          nextNode.pos + 1
        ]);
      }

      if (ts.isTypePredicateNode(curChild)) {
        // children[index], node = x is any
        // :
        const prevNode = children[index - 1];
        return this.pushAnalyzedType(TYPE_KIND.FUNCTION_TYPE_PREDICATE, [
          prevNode.end - 1,
          curChild.end
        ]);
      }

      if (parent.type === curChild) {
        // children[index], node = function return type
        // :
        const prevNode = children[index - 1];
        return this.pushAnalyzedType(TYPE_KIND.FUNCTION_RETURN, [
          prevNode.end - 1,
          curChild.end
        ]);
      }
    }

    // `import/export type ...;` get `import/export type ...;`
    // especial:` export {a, type b}` get ` type b`
    function handleParentImportOrExportDeclaration(
      this: TypeAnalyzer,
      curChild: ts.ImportDeclaration | ts.ExportDeclaration
    ) {
      if (curChild.kind === ts.SyntaxKind.ImportDeclaration) {
        return this.pushAnalyzedType(TYPE_KIND.TYPE_ONLY_IMPORT_DECLARATION, [
          curChild.pos,
          curChild.end
        ]);
      } else {
        // export type *
        if (curChild?.isTypeOnly) {
          return this.pushAnalyzedType(TYPE_KIND.TYPE_ONLY_EXPORT_DECLARATION, [
            curChild.pos,
            curChild.end
          ]);
        }
        // export {type}
        else {
          ts.forEachChild(curChild, _child => this.visit(_child, curChild));
        }
      }
    }
    // context = `import {a1, type a2} from "a"` get `type a2`
    function handleImportOrExportSpecifier(
      this: TypeAnalyzer,
      curChild: ts.ImportSpecifier | ts.ExportSpecifier
    ) {
      // TODO: offset
      const mappingKind = {
        [ts.SyntaxKind.ImportSpecifier]: TYPE_KIND.IMPORT_TYPE_SPECIFIER,
        [ts.SyntaxKind.ExportSpecifier]: TYPE_KIND.EXPORT_TYPE_SPECIFIER
      };
      this.pushAnalyzedType(mappingKind[curChild.kind], [curChild.pos, curChild.end]);
    }
  }

  private pushAnalyzedType(
    kind: AnalyzedType['kind'],
    range: [pos: number, end: number]
  ) {
    const [pos, end] = range;
    const text = this.sourceFile.text.slice(pos, end);
    this.analyzedTypes.push({ kind, range: { pos, end }, text });
  }
}
