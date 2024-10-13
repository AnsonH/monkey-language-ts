import {
  BlockStatement,
  Expression,
  Identifier,
  IfExpression,
  Node,
  Statement,
} from "../parser/ast.js";
import Environment from "./environment.js";
import {
  EvaluationError,
  IdentifierNotFoundError,
  NotAFunctionError,
  TypeMismatchError,
  UnknownOperatorError,
} from "./error.js";
import {
  Integer,
  MBoolean,
  MFunction,
  MObject,
  Null,
  ReturnValue,
} from "./object.js";

// Creating constants for these values can:
// 1. Avoid creating new instances for the same values
// 2. Allow strict comparison (===)
export const TRUE = new MBoolean(true);
export const FALSE = new MBoolean(false);
export const NULL = new Null();

/**
 * A tree-walking interpreter that evaluates the AST.
 */
export function evaluate(node: Node, env: Environment): MObject {
  switch (node.type) {
    case "Program":
      return evalProgram(node.statements, env);

    // Statements
    case "BlockStatement":
      return evalBlockStatement(node, env);
    case "ExpressionStatement":
      return evaluate(node.expression, env);
    case "LetStatement": {
      const value = evaluate(node.value, env);
      if (value instanceof EvaluationError) {
        return value;
      }
      env.set(node.name.value, value);
      break;
    }
    case "ReturnStatement": {
      const returnValue = evaluate(node.returnValue, env);
      if (returnValue instanceof EvaluationError) {
        return returnValue;
      }
      return new ReturnValue(returnValue);
    }

    // Expressions
    case "BooleanLiteral":
      return nativeBoolToBooleanObject(node.value);
    case "CallExpression": {
      /**
       * Two cases under valid syntax:
       * 1. With identifier (e.g. `foo(5)`) -> Calls {@link evalIdentifier} to
       *   search the {@link MFunction} definition in the environment.
       * 2. Immediately invoked (e.g. `fn(x){ x }(5)`) -> Evaluates the function
       *   literal to get {@link MFunction}.
       */
      const fn = evaluate(node.function, env);
      if (fn instanceof EvaluationError) {
        return fn;
      }

      const args = evalExpressions(node.arguments, env);
      if (args.length === 1 && args[0] instanceof EvaluationError) {
        return args[0];
      }

      return applyFunction(fn, args);
    }
    case "FunctionLiteral":
      return new MFunction(node.parameters, node.body, env);
    case "Identifier":
      return evalIdentifier(node, env);
    case "IfExpression":
      return evalIfExpression(node, env);
    case "InfixExpression": {
      const left = evaluate(node.left, env);
      if (left instanceof EvaluationError) {
        return left;
      }
      const right = evaluate(node.right, env);
      if (right instanceof EvaluationError) {
        return right;
      }
      return evalInfixExpression(node.operator, left, right);
    }
    case "IntegerLiteral":
      return new Integer(node.value);
    case "PrefixExpression": {
      const right = evaluate(node.right, env);
      if (right instanceof EvaluationError) {
        return right;
      }
      return evalPrefixExpression(node.operator, right);
    }
  }

  return NULL;
}

/**
 * Invokes the function with the arguments.
 * @param fn Only object of type {@link MFunction} is considered valid
 */
function applyFunction(fn: MObject, args: MObject[]): MObject {
  if (!(fn instanceof MFunction)) {
    return new NotAFunctionError(fn.inspect());
  }

  const extendedEnv = extendFunctionEnv(fn, args);
  const evaluated = evaluate(fn.body, extendedEnv);
  return unwrapReturnValue(evaluated);
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

function evalBooleanInfixExpression(
  operator: string,
  left: MBoolean,
  right: MBoolean,
): MObject {
  switch (operator) {
    case "==":
      return nativeBoolToBooleanObject(left.value === right.value);
    case "!=":
      return nativeBoolToBooleanObject(left.value !== right.value);
    default:
      return new UnknownOperatorError(
        `${left.inspect()} ${operator} ${right.inspect()}`,
      );
  }
}

function evalBlockStatement(block: BlockStatement, env: Environment): MObject {
  let result: MObject = NULL;

  for (const statement of block.statements) {
    result = evaluate(statement, env);

    if (result instanceof EvaluationError || result instanceof ReturnValue) {
      // If it's ReturnValue, we return whole object instead of `result.value`
      return result;
    }
  }

  return result;
}

function evalExpressions(exps: Expression[], env: Environment): MObject[] {
  const result: MObject[] = [];

  for (const exp of exps) {
    const evaluated = evaluate(exp, env);
    if (evaluated instanceof EvaluationError) {
      return [evaluated];
    }
    result.push(evaluated);
  }

  return result;
}

function evalIdentifier(node: Identifier, env: Environment): MObject {
  const valueObj = env.get(node.value);
  if (!valueObj) {
    return new IdentifierNotFoundError(node.value);
  }
  return valueObj;
}

function evalIfExpression(node: IfExpression, env: Environment): MObject {
  const condition = evaluate(node.condition, env);
  if (condition instanceof EvaluationError) {
    return condition;
  }
  if (isTruthy(condition)) {
    return evaluate(node.consequence, env);
  }
  return node.alternative ? evaluate(node.alternative, env) : NULL;
}

function evalInfixExpression(
  operator: string,
  left: MObject,
  right: MObject,
): MObject {
  if (left instanceof Integer && right instanceof Integer) {
    return evalIntegerInfixExpression(operator, left, right);
  }
  if (left instanceof MBoolean && right instanceof MBoolean) {
    return evalBooleanInfixExpression(operator, left, right);
  }

  if (left.constructor.name !== right.constructor.name) {
    return new TypeMismatchError(
      `${left.inspect()} ${operator} ${right.inspect()}`,
    );
  }
  return new UnknownOperatorError(
    `${left.inspect()} ${operator} ${right.inspect()}`,
  );
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
      return new UnknownOperatorError(
        `${left.inspect()} ${operator} ${right.inspect()}`,
      );
  }
}

function evalMinusPrefixOperatorExpression(right: MObject): MObject {
  if (right instanceof Integer) {
    return new Integer(-right.value);
  }
  return new UnknownOperatorError(`-${right.inspect()}`);
}

function evalPrefixExpression(operator: string, right: MObject): MObject {
  switch (operator) {
    case "!":
      return evalBangOperatorExpression(right);
    case "-":
      return evalMinusPrefixOperatorExpression(right);
    default:
      return new UnknownOperatorError(`${operator}${right.inspect()}`);
  }
}

function evalProgram(statements: Statement[], env: Environment): MObject {
  let result: MObject = NULL;

  for (const statement of statements) {
    result = evaluate(statement, env);

    // Early stopping
    if (result instanceof EvaluationError) {
      return result;
    }
    if (result instanceof ReturnValue) {
      return result.value;
    }
  }

  return result;
}

function extendFunctionEnv(fn: MFunction, args: MObject[]): Environment {
  const env = new Environment(fn.env);
  fn.parameters.forEach((param, idx) => {
    env.set(param.value, args[idx]);
  });
  return env;
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

function unwrapReturnValue(obj: MObject): MObject {
  return obj instanceof ReturnValue ? obj.value : obj;
}
