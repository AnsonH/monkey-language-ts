/**
 * The base object interface that represents every Monkey language's value.
 */
export interface MObject {
  /**
   * Returns the string representation for display.
   */
  inspect(): string;
}

// TODO(Anson): Make the `value` readonly?

export class MBoolean implements MObject {
  constructor(public value: boolean) {}

  inspect(): string {
    return this.value.toString();
  }
}

export class Integer implements MObject {
  constructor(public value: number) {}

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
  constructor(public value: MObject) {}

  inspect(): string {
    return this.value.inspect();
  }
}
