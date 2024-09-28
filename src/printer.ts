import { Node } from "./ast.js";

function print(node: Node): string {
  switch (node.type) {
    case "Program":
      return node.statements.map(print).join("\n");

    // Statements
    case "ExpressionStatement":
      return `${print(node.expression)};`;
    case "LetStatement":
      return `let ${node.name.value} = ${print(node.value)};`;
    case "ReturnStatement":
      return `return ${print(node.returnValue)};`;

    // Expressions
    case "BooleanLiteral":
      return node.value.toString();
    case "Identifier":
      return node.value;
    case "IntegerLiteral":
      return node.value.toString();
    case "PrefixExpression":
      return `(${node.operator}${print(node.right)})`;
    case "InfixExpression": {
      return `(${print(node.left)} ${node.operator} ${print(node.right)})`;
    }
  }
}

export default print;
