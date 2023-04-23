import ts from 'typescript';

const tsTemplate = `
function a<B extends 222>(test: number | 1): void;
const foo: /* 1 */BBB = 1 as "123123123" | 2222;

type C = 1;

interface D {
}

function e(b): boolean {
  type K = 1;
}
`;

const sourceFile = ts.createSourceFile('temp.ts', tsTemplate, ts.ScriptTarget.Latest);

function visit(node: ts.Node, parent: ts.Node | null) {
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
    ts.isTypeLiteralNode(node)
  ) {
    // 获取 node 的父节点
    // console.log('Parent:', node.parent.getText(sourceFile));

    // 通过 ts 取出 node 的父节点
    //
    const children = parent?.getChildren(sourceFile);

    console.log('Type node:', node.getText(sourceFile));
  } else {
    ts.forEachChild(node, child => visit(child, node));
  }
  // if (ts.isTypeReferenceNode(node)) {
  //   console.log('Type reference:', node.typeName.getText(sourceFile));
  // } else if (ts.isTypeAliasDeclaration(node) || ts.isInterfaceDeclaration(node)) {
  //   console.log('Type alias or interface:', node.name.getText(sourceFile));
  // }
}

visit(sourceFile, null);
