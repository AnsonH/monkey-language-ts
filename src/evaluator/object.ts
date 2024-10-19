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

type BuiltinFunction = (...args: MObject[]) => MObject;

export class Builtin implements MObject {
  constructor(public readonly fn: BuiltinFunction) {}

  inspect(): string {
    return "builtin function";
  }
}

export class MArray implements MObject {
  constructor(public readonly elements: MObject[]) {}

  inspect(): string {
    const elements = this.elements.map((e) => e.inspect());
    return `[${elements.join(", ")}]`;
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

/**
 * A primitive value representation of `HashPair["key"]`.
 *
 * The official Go implementation uses `uint64` because Go does not support mixed
 * key types in maps. TypeScript does not have this limitation.
 */
export type HashKey = string | number | boolean;

export type HashPair = {
  key: MString | Integer | MBoolean;
  value: MObject;
};

export type HashPairs = Map<HashKey, HashPair>;

export class Hash implements MObject {
  // We don't use `Map<MString | Integer | MBoolean, MObject>` because the keys
  // are non-primitive values. Getting by key (e.g. `hash.pairs.get(new MString("foo"))`),
  // would NOT work since the key is a different object instance.
  public readonly pairs: HashPairs = new Map();

  constructor(pairs: HashPairs) {
    this.pairs = pairs;
  }

  inspect(): string {
    const pairs: string[] = [];
    for (const { key, value } of this.pairs.values()) {
      pairs.push(`${key.inspect()}: ${value.inspect()}`);
    }
    return `{${pairs.join(", ")}}`;
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

export class MString implements MObject {
  constructor(public readonly value: string) {}

  inspect(): string {
    return `"${this.value}"`;
  }
}
