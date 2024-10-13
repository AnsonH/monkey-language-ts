import { MObject } from "./object.js";

/**
 * "Environment" keeps track of identifiers and their values.
 */
class Environment {
  private store: Map<string, MObject>;

  constructor() {
    this.store = new Map();
  }

  get(name: string): MObject | undefined {
    return this.store.get(name);
  }

  set(name: string, value: MObject): MObject {
    this.store.set(name, value);
    return value;
  }
}

export default Environment;
