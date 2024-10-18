import {
  ArgumentNotSupportedError,
  ArgumentWrongNumberError,
} from "./error.js";
import { Builtin, Integer, MString } from "./object.js";

/**
 * Built-in functions.
 */
const builtins: Readonly<Record<string, Builtin>> = {
  /**
   * Gets the length of a string.
   *
   * @example
   * len("hello") // 5
   */
  len: new Builtin((...args) => {
    if (args.length !== 1) {
      return new ArgumentWrongNumberError(1, args.length);
    }
    const arg = args[0];

    if (arg instanceof MString) {
      return new Integer(arg.value.length);
    }
    return new ArgumentNotSupportedError(
      `Argument to 'len' not supported, got ${arg.inspect()}`,
    );
  }),
};

export default builtins;
