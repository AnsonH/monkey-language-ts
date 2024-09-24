import { TokenType } from "./token.js";

export class ParseError extends Error {}

export class UnexpectedTokenError extends ParseError {
  name = "UnexpectedTokenError";

  constructor(
    public expected: TokenType,
    public actual: TokenType,
  ) {
    const message = `Expected next token to be '${expected}', but got '${actual}'.`;
    super(message);
  }
}
