import { Node } from "./ast.js";

function print(node: Node): string {
  switch (node.type) {
    // Statements
    case "Program":
    case "BlockStatement":
      return node.statements.map(print).join("\n");
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
    case "IfExpression": {
      const { condition, consequence, alternative } = node;
      const ifBranch = `if ${print(condition)} ${print(consequence)}`;
      const elseBranch = alternative ? `else ${print(alternative)}` : "";
      return ifBranch + elseBranch;
    }
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
