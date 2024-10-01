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
export type Expression =
  | BooleanLiteral
  | FunctionLiteral
  | Identifier
  | IfExpression
  | InfixExpression
  | IntegerLiteral
  | PrefixExpression;

/**
 * Statement does not produce a value.
 */
export type Statement =
  | BlockStatement
  | ExpressionStatement
  | LetStatement
  | ReturnStatement;

/**
 * Root node of the AST that represents the entire program.
 */
export interface Program extends BaseNode {
  type: "Program";
  statements: Statement[];
}

export interface BooleanLiteral extends BaseNode {
  type: "BooleanLiteral";
  value: boolean;
}

/**
 * Syntax: `fn(<parameter1>, <parameter2>, ...) { <statements> }`
 */
export interface FunctionLiteral extends BaseNode {
  type: "FunctionLiteral";
  parameters: Identifier[];
  body: BlockStatement;
}

export interface Identifier extends BaseNode {
  type: "Identifier";
  value: string;
}

/**
 * Syntax:
 * - `if ( <condition> ) { <statements> }`
 * - `if ( <condition> ) { <statements> } else { <statements> }`
 */
export interface IfExpression extends BaseNode {
  type: "IfExpression";
  condition: Expression;
  consequence: BlockStatement;
  alternative: BlockStatement | null;
}

export interface IntegerLiteral extends BaseNode {
  type: "IntegerLiteral";
  value: number;
}

export interface PrefixExpression extends BaseNode {
  type: "PrefixExpression";
  operator: string;
  right: Expression;
}

export interface InfixExpression extends BaseNode {
  type: "InfixExpression";
  left: Expression;
  operator: string;
  right: Expression;
}

/**
 * Syntax: `{ <statements> }`
 */
export interface BlockStatement extends BaseNode {
  type: "BlockStatement";
  statements: Statement[];
}

/**
 * Example: `x + 10;`
 */
export interface ExpressionStatement extends BaseNode {
  type: "ExpressionStatement";
  expression: Expression;
}

/**
 * Syntax: `let <identifier> = <expression>`
 */
export interface LetStatement extends BaseNode {
  type: "LetStatement";
  name: Identifier;
  value: Expression;
}

export interface ReturnStatement extends BaseNode {
  type: "ReturnStatement";
  returnValue: Expression;
}
