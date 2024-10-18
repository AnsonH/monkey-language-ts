import { Node } from "./ast.js";

/**
 * Returns a string representation of the given AST node.
 */
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
    case "ArrayLiteral": {
      const elements = node.elements.map(print).join(", ");
      return `[${elements}]`;
    }
    case "BooleanLiteral":
      return node.value.toString();
    case "CallExpression": {
      const args = node.arguments.map(print).join(", ");
      return `${print(node.function)}(${args})`;
    }
    case "FunctionLiteral": {
      const parameters = node.parameters.map((p) => p.value).join(", ");
      const body = print(node.body);
      return `fn (${parameters}) ${body}`;
    }
    case "Identifier":
      return node.value;
    case "IfExpression": {
      const { condition, consequence, alternative } = node;
      const ifBranch = `if ${print(condition)} ${print(consequence)}`;
      const elseBranch = alternative ? `else ${print(alternative)}` : "";
      return ifBranch + elseBranch;
    }
    case "IndexExpression":
      return `(${print(node.left)}[${print(node.index)}])`;
    case "IntegerLiteral":
      return node.value.toString();
    case "PrefixExpression":
      return `(${node.operator}${print(node.right)})`;
    case "InfixExpression":
      return `(${print(node.left)} ${node.operator} ${print(node.right)})`;
    case "StringLiteral":
      return `"${node.value}"`;
  }
}

export default print;
