import { BlockStatement, Identifier } from "../parser/ast.js";
import print from "../parser/printer.js";
import Environment from "./environment.js";

/**
 * The base object interface that represents every Monkey language's value.
 */
export interface MObject {
  /**
   * Returns the string representation for display.
   */
  inspect(): string;
}

export class MBoolean implements MObject {
  constructor(public readonly value: boolean) {}

  inspect(): string {
    return this.value.toString();
  }
}

export class MFunction implements MObject {
  constructor(
    public readonly parameters: Identifier[],
    public readonly body: BlockStatement,
    /**
     * This allows for closures, which "close over" the environment that this
     * function is defined in, and can later access it.
     */
    public readonly env: Environment,
  ) {}

  inspect(): string {
    const parameters = this.parameters.map((p) => p.value).join(", ");
    const body = print(this.body);
    return `fn(${parameters}) {\n  ${body}\n}`;
  }
}

export class Integer implements MObject {
  constructor(public readonly value: number) {}

  inspect(): string {
    return this.value.toFixed(0);
  }
}

export class Null implements MObject {
  inspect(): string {
    return "null";
  }
}

export class ReturnValue implements MObject {
  constructor(public readonly value: MObject) {}

  inspect(): string {
    return this.value.inspect();
  }
}
