import ts from 'typescript';
import { log } from '../../log';
import { functionsIn, isEqual } from 'lodash-es';

export interface AnalyzedType {
  range: ts.TextRange;
  text: string;
}

export class TypeAnalyzer {
  public sourceFile: ts.SourceFile;
  public analyzedTypes: AnalyzedType[] = [];

  constructor(code: string) {
    this.sourceFile = ts.createSourceFile('temp.ts', code, ts.ScriptTarget.Latest);
  }

  analyze() {
    this.visit(this.sourceFile, null);
    this.cleanAnalyzedTypes();

    return this.analyzedTypes;
  }

  private cleanAnalyzedTypes() {
    const toRemoveIndex = new Set<number>();

    this.analyzedTypes.forEach((type, index) => {
      if (toRemoveIndex.has(index)) return;

      this.analyzedTypes.forEach((_type, _index) => {
        if (index === _index || toRemoveIndex.has(_index)) return;

        if (isEqual(_type, type)) return toRemoveIndex.add(index);

        if (type.range.pos >= _type.range.pos) {
          if (type.range.end < _type.range.end) toRemoveIndex.add(index);
        }
      });
    });

    const sortedToRemoveIndex = Array.from(toRemoveIndex).sort((a, b) => b - a);
    sortedToRemoveIndex.forEach(index => this.analyzedTypes.splice(index, 1));
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
      ts.isEnumDeclaration(node)
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
      [ts.SyntaxKind.Parameter]: handleParentParameter.bind(this),
      [ts.SyntaxKind.VariableDeclaration]: handleParentVariableDeclaration.bind(this),
      [ts.SyntaxKind.AsExpression]: handleParentAsOrSatisfiesExpr.bind(this),
      [ts.SyntaxKind.SatisfiesExpression]: handleParentAsOrSatisfiesExpr.bind(this),
      [ts.SyntaxKind.TypeAssertionExpression]: handleParentTypeAssertionExpr.bind(this),
      [ts.SyntaxKind.CallExpression]: handleParentCallOrNewExpr.bind(this),
      [ts.SyntaxKind.NewExpression]: handleParentCallOrNewExpr.bind(this)
    };

    const childNodeHandlers: NodeHandlers = {
      [ts.SyntaxKind.InterfaceDeclaration]: handleChildInterfaceOrTypeAlias.bind(this),
      [ts.SyntaxKind.TypeAliasDeclaration]: handleChildInterfaceOrTypeAlias.bind(this),
      [ts.SyntaxKind.VariableStatement]: handleChildDeclareStatement.bind(this),
      [ts.SyntaxKind.ClassDeclaration]: handleChildDeclareStatement.bind(this),
      [ts.SyntaxKind.ModuleDeclaration]: handleChildDeclareStatement.bind(this),
      [ts.SyntaxKind.EnumDeclaration]: handleChildDeclareStatement.bind(this)
    };

    if (parent.kind in parentNodeHandlers) {
      parentNodeHandlers[parent.kind]!(parent, child);
    } else {
      console.error('[Error]: Unknown parent node kind: ' + parent.kind);
    }

    if (child.kind in childNodeHandlers) {
      childNodeHandlers[child.kind]!(child);
    } else {
      console.error('[Error]: Unknown parent node kind: ' + parent.kind);
    }

    return;

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
        return this.pushAnalyzedType(prevNode.end - 1, nextNode.pos + 1);
      }
    }

    // <number>a
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

      return this.pushAnalyzedType(prevNode.end - 1, nextNode.pos + 1);
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

      return this.pushAnalyzedType(prevNode.pos, curChild.end);
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
        this.pushAnalyzedType(child.pos, child.end);
      } else {
        ts.forEachChild(child, _child => this.visit(_child, child));
      }
    }

    // context = `const a: number`, curChild = `number`
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
      this.pushAnalyzedType(prevNode.end - 1, curChild.end);
    }

    function handleChildInterfaceOrTypeAlias(
      this: TypeAnalyzer,
      child: ts.InterfaceDeclaration
    ) {
      this.pushAnalyzedType(child.pos, child.end);
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
      const optionalToken = children[index - 2];
      const isOptionalToken = optionalToken.kind === ts.SyntaxKind.QuestionToken;

      this.pushAnalyzedType(
        isOptionalToken ? optionalToken.pos : prevNode.pos,
        curChild.end
      );
    }

    function handleParentFunction(
      this: TypeAnalyzer,
      parent: ts.FunctionDeclaration | ts.MethodDeclaration | ts.FunctionExpression,
      curChild: ts.Node
    ) {
      // 没有 body，如： function a<B extends 222>(test: ...): void;
      if (!parent.body) {
        return this.pushAnalyzedType(parent.pos, parent.end);
      }
      const children = parent.getChildren(this.sourceFile);
      const index = children.findIndex(
        child => child.pos === curChild.pos && child.end === curChild.end
      );

      // 有 body，如： function a<B extends 222>(test: ...) { ... }

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
        return this.pushAnalyzedType(prevNode.end - 1, nextNode.pos + 1);
      }

      if (ts.isTypePredicateNode(curChild)) {
        // children[index], node = x is any
        // :
        const prevNode = children[index - 1];
        return this.pushAnalyzedType(prevNode.end - 1, curChild.end);
      }

      if (parent.type === curChild) {
        // children[index], node = function return type
        // :
        const prevNode = children[index - 1];
        return this.pushAnalyzedType(prevNode.end - 1, curChild.end);
      }
    }
  }

  private pushAnalyzedType(pos: number, end: number) {
    const text = this.sourceFile.text.slice(pos, end);
    this.analyzedTypes.push({ range: { pos, end }, text });
  }
}
