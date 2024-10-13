import { MObject } from "./object.js";

/**
 * "Environment" keeps track of identifiers and their values.
 *
 * It supports closures, where the inner environment can access the outer
 * environment. For example:
 *
 * ```
 * let newAdder = fn(x) {
 *   fn(y) { x + y }
 * };
 * let addTwo = newAdder(2);
 * addTwo(2);  // 2
 * ```
 *
 * When `addTwo(2)` is run, the inner function `fn(y) { x + y }` captures the
 * outer environment's `x` value of `2`.
 */
class Environment {
  private store: Map<string, MObject>;
  private outer: Environment | null;

  constructor(outer: Environment | null = null) {
    this.store = new Map();
    this.outer = outer;
  }

  /**
   * Gets the value of an identifier.
   *
   * If the current environment has no such identifier, it recursively searches
   * the outer environment layer by layer.
   */
  get(name: string): MObject | undefined {
    const value = this.store.get(name);
    if (!value && this.outer) {
      return this.outer.get(name);
    }
    return value;
  }

  set(name: string, value: MObject): MObject {
    this.store.set(name, value);
    return value;
  }
}

export default Environment;
