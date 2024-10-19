import {
  ArgumentNotSupportedError,
  ArgumentWrongNumberError,
} from "./error.js";
import { NULL } from "./evaluator.js";
import { Builtin, Integer, MArray, MString } from "./object.js";

/**
 * Built-in functions.
 */
const builtins: Readonly<Record<string, Builtin>> = {
  /**
   * Returns the length of a string or an array.
   *
   * @example
   * len("hello") // 5
   * len([1, 2, 3]) // 3
   */
  len: new Builtin((...args) => {
    if (args.length !== 1) {
      return new ArgumentWrongNumberError(1, args.length);
    }
    const arg = args[0];

    if (arg instanceof MString) {
      return new Integer(arg.value.length);
    }
    if (arg instanceof MArray) {
      return new Integer(arg.elements.length);
    }
    return new ArgumentNotSupportedError(
      `Argument to 'len' not supported, got ${arg.inspect()}`,
    );
  }),

  /**
   * Returns the first element of an array.
   *
   * @example
   * first([1, 2, 3]) // 1
   * first([]) // null
   */
  first: new Builtin((...args) => {
    if (args.length !== 1) {
      return new ArgumentWrongNumberError(1, args.length);
    }
    const arg = args[0];

    if (!(arg instanceof MArray)) {
      return new ArgumentNotSupportedError(
        `Argument to 'first' must be an array, got ${arg.inspect()}`,
      );
    }
    return arg.elements[0] ?? NULL;
  }),

  /**
   * Returns the last element of an array.
   *
   * @example
   * last([1, 2, 3]) // 3
   * last([]) // null
   */
  last: new Builtin((...args) => {
    if (args.length !== 1) {
      return new ArgumentWrongNumberError(1, args.length);
    }
    const arg = args[0];

    if (!(arg instanceof MArray)) {
      return new ArgumentNotSupportedError(
        `Argument to 'last' must be an array, got ${arg.inspect()}`,
      );
    }

    return arg.elements[arg.elements.length - 1] ?? NULL;
  }),

  /**
   * Returns all elements of an array except the first.
   *
   * @example
   * rest([1, 2, 3]) // [2, 3]
   * rest([]) // null
   */
  rest: new Builtin((...args) => {
    if (args.length !== 1) {
      return new ArgumentWrongNumberError(1, args.length);
    }
    const arg = args[0];

    if (!(arg instanceof MArray)) {
      return new ArgumentNotSupportedError(
        `Argument to 'rest' must be an array, got ${arg.inspect()}`,
      );
    }

    if (arg.elements.length > 0) {
      const rest = arg.elements.slice(1);
      return new MArray(rest);
    }
    return NULL;
  }),

  /**
   * Creates a new array, and appends the given element to the end of it.
   *
   * @example
   * let arr = [1, 2, 3];
   * push(arr, "hi"); // [1, 2, 3, "hi"]
   * arr; // [1, 2, 3]
   */
  push: new Builtin((...args) => {
    if (args.length !== 2) {
      return new ArgumentWrongNumberError(2, args.length);
    }
    if (!(args[0] instanceof MArray)) {
      return new ArgumentNotSupportedError(
        `First argument to 'push' must be an array, got ${args[0].inspect()}`,
      );
    }

    const [arr, element] = args;
    return new MArray([...arr.elements, element]);
  }),
};

export default builtins;
