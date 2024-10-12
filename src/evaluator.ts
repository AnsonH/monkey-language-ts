import { Node, Statement } from "./ast.js";
import { MBoolean, Integer, MObject, Null } from "./object.js";

// NOTE: Creating constants can avoid creating new instances for the same values
export const TRUE = new MBoolean(true);
export const FALSE = new MBoolean(false);
export const NULL = new Null();

/**
 * A tree-walking interpreter that evaluates the AST.
 */
export function evaluate(node: Node): MObject {
  switch (node.type) {
    // Statements
    case "Program":
      return evalStatements(node.statements);
    case "ExpressionStatement":
      return evaluate(node.expression);

    // Expressions
    case "BooleanLiteral":
      return nativeBoolToBooleanObject(node.value);
    case "IntegerLiteral":
      return new Integer(node.value);
  }

  return NULL;
}

function evalStatements(statements: Statement[]): MObject {
  let result: MObject = NULL;

  for (const statement of statements) {
    result = evaluate(statement);
  }

  return result;
}

function nativeBoolToBooleanObject(input: boolean): MBoolean {
  return input ? TRUE : FALSE;
}
