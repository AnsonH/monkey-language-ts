import { MObject } from "./object.js";

/**
 * Base class for all errors during evaluation.
 *
 * For simplicity, it does not have stack trace, line/column information, etc.
 */
export class EvaluationError extends Error implements MObject {
  inspect(): string {
    return this.message;
  }
}

export class ArgumentNotSupportedError extends EvaluationError {
  name = "ArgumentNotSupportedError";
}

export class ArgumentWrongNumberError extends EvaluationError {
  name = "ArgumentWrongNumberError";

  constructor(
    public expected: number,
    public got: number,
  ) {
    super(`Wrong number of arguments: expected ${expected}, got ${got}`);
  }
}

export class IdentifierNotFoundError extends EvaluationError {
  name = "IdentifierNotFoundError";

  constructor(public identifier: string) {
    super(`Identifier not found: ${identifier}`);
  }
}

export class IndexOperatorNotSupported extends EvaluationError {
  name = "IndexOperatorNotSupported";

  constructor(public left: string) {
    super(`Index operator not supported: ${left}`);
  }
}

export class InvalidHashKeyError extends EvaluationError {
  name = "InvalidHashKeyError";

  constructor(public key: string) {
    super(`Hash key must be string, integer, or boolean, got: ${key}`);
  }
}

export class NotAFunctionError extends EvaluationError {
  name = "NotAFunctionError";

  constructor(public identifier: string) {
    super(`Not a function: ${identifier}`);
  }
}

export class TypeMismatchError extends EvaluationError {
  name = "TypeMismatchError";

  constructor(public expression: string) {
    super(`Type mismatch: ${expression}`);
  }
}

export class UnknownOperatorError extends EvaluationError {
  name = "UnknownOperatorError";

  constructor(public expression: string) {
    super(`Unknown operator: ${expression}`);
  }
}
