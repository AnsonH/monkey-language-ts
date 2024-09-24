// Inspired by:
// Babel AST: https://github.com/babel/babel/blob/main/packages/babel-types/src/ast-types/generated/index.ts
// ts-monkey: https://github.com/CDThomas/ts-monkey/blob/master/language/ast.ts

interface BaseNode {
  type: Node["type"];
}

export type Node = Program | Expression | Statement;

/**
 * Expression produces a value.
 */
export type Expression = Identifier;

/**
 * Statement does not produce a value.
 */
export type Statement = LetStatement | ReturnStatement;

/**
 * Root node of the AST that represents the entire program.
 */
export interface Program extends BaseNode {
  type: "Program";
  statements: Statement[];
}

export interface Identifier extends BaseNode {
  type: "Identifier";
  value: string;
}

export interface LetStatement extends BaseNode {
  type: "LetStatement";
  name: Identifier;
  value: Expression;
}

export interface ReturnStatement extends BaseNode {
  type: "ReturnStatement";
  returnValue: Expression;
}
