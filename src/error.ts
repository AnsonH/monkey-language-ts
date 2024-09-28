import { TokenType } from "./token.js";

export class ParseError extends Error {}

export class NoPrefixParseFunctionError extends ParseError {
  name = "NoPrefixParseFunctionError";

  constructor(public tokenType: TokenType) {
    super(`No prefix parse function for '${tokenType}' found.`);
  }
}

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
