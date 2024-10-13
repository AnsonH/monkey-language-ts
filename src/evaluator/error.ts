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
