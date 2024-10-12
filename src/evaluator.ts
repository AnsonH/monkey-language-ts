import { BlockStatement, IfExpression, Node, Statement } from "./ast.js";
import { MBoolean, Integer, MObject, Null, ReturnValue } from "./object.js";

// NOTE: Creating constants can avoid creating new instances for the same values
export const TRUE = new MBoolean(true);
export const FALSE = new MBoolean(false);
export const NULL = new Null();

/**
 * A tree-walking interpreter that evaluates the AST.
 */
export function evaluate(node: Node): MObject {
  switch (node.type) {
    case "Program":
      return evalProgram(node.statements);

    // Statements
    case "BlockStatement":
      return evalBlockStatement(node);
    case "ExpressionStatement":
      return evaluate(node.expression);
    case "ReturnStatement":
      return new ReturnValue(evaluate(node.returnValue));

    // Expressions
    case "BooleanLiteral":
      return nativeBoolToBooleanObject(node.value);
    case "IfExpression":
      return evalIfExpression(node);
    case "InfixExpression":
      return evalInfixExpression(
        node.operator,
        evaluate(node.left),
        evaluate(node.right),
      );
    case "IntegerLiteral":
      return new Integer(node.value);
    case "PrefixExpression":
      return evalPrefixExpression(node.operator, evaluate(node.right));
  }

  return NULL;
}

function evalBangOperatorExpression(right: MObject): MObject {
  // NOTE: JS switch statement uses strict comparison (===), so:
  // - Works: `TRUE === TRUE`
  // - Not works: `TRUE === new MBoolean(true)`
  // It works for our case since we always use those constants
  switch (right) {
    case TRUE:
      return FALSE;
    case FALSE:
      return TRUE;
    case NULL:
      return TRUE;
    default:
      return FALSE;
  }
}

function evalBlockStatement(block: BlockStatement): MObject {
  let result: MObject = NULL;

  for (const statement of block.statements) {
    result = evaluate(statement);

    if (result instanceof ReturnValue) {
      return result; // Return whole ReturnValue object instead of `result.value`
    }
  }

  return result;
}

function evalIfExpression(node: IfExpression): MObject {
  const condition = evaluate(node.condition);
  if (isTruthy(condition)) {
    return evaluate(node.consequence);
  }
  return node.alternative ? evaluate(node.alternative) : NULL;
}

function evalInfixExpression(
  operator: string,
  left: MObject,
  right: MObject,
): MObject {
  if (left instanceof Integer && right instanceof Integer) {
    return evalIntegerInfixExpression(operator, left, right);
  } else if (operator === "==") {
    return nativeBoolToBooleanObject(left === right);
  } else if (operator === "!=") {
    return nativeBoolToBooleanObject(left !== right);
  }

  return NULL;
}

function evalIntegerInfixExpression(
  operator: string,
  left: Integer,
  right: Integer,
): MObject {
  switch (operator) {
    case "+":
      return new Integer(left.value + right.value);
    case "-":
      return new Integer(left.value - right.value);
    case "*":
      return new Integer(left.value * right.value);
    case "/":
      return new Integer(left.value / right.value);
    case "<":
      return nativeBoolToBooleanObject(left.value < right.value);
    case ">":
      return nativeBoolToBooleanObject(left.value > right.value);
    case "==":
      return nativeBoolToBooleanObject(left.value === right.value);
    case "!=":
      return nativeBoolToBooleanObject(left.value !== right.value);
    default:
      return NULL;
  }
}

function evalMinusPrefixOperatorExpression(right: MObject): MObject {
  if (right instanceof Integer) {
    return new Integer(-right.value);
  }
  return NULL;
}

function evalPrefixExpression(operator: string, right: MObject): MObject {
  switch (operator) {
    case "!":
      return evalBangOperatorExpression(right);
    case "-":
      return evalMinusPrefixOperatorExpression(right);
    default:
      return NULL;
  }
}

function evalProgram(statements: Statement[]): MObject {
  let result: MObject = NULL;

  for (const statement of statements) {
    result = evaluate(statement);

    if (result instanceof ReturnValue) {
      // Stop the program and return the value
      return result.value;
    }
  }

  return result;
}

/**
 * A value is "truthy" if it is not null and not false.
 *
 * NOTE: Original specs of Monkey considers `0` is truthy.
 */
function isTruthy(obj: MObject): boolean {
  return obj !== NULL && obj !== FALSE;
}

function nativeBoolToBooleanObject(input: boolean): MBoolean {
  return input ? TRUE : FALSE;
}
