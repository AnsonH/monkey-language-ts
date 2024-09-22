export enum TokenType {
  /**
   * Token/character we don't know about.
   */
  Illegal = "ILLEGAL",
  /**
   * End of file.
   */
  Eof = "EOF",

  // Identifiers + literals
  Ident = "IDENT", // add, foobar, x, y, ...
  Int = "INT", // 1343456

  // Operators
  Assign = "=",
  Plus = "+",
  Minus = "-",
  Bang = "!",
  Asterisk = "*",
  Slash = "/",
  LessThan = "<",
  GreaterThan = ">",
  Equal = "==",
  NotEqual = "!=",

  // Delimiters
  Comma = ",",
  Semicolon = ";",

  LParen = "(",
  RParen = ")",
  LBrace = "{",
  RBrace = "}",

  // Keywords
  Function = "FUNCTION",
  Let = "LET",
  True = "TRUE",
  False = "FALSE",
  If = "IF",
  Else = "ELSE",
  Return = "RETURN",
}

export type Token = {
  type: TokenType;
  literal: string;
};

const keywords: Record<string, TokenType> = {
  fn: TokenType.Function,
  let: TokenType.Let,
  true: TokenType.True,
  false: TokenType.False,
  if: TokenType.If,
  else: TokenType.Else,
  return: TokenType.Return,
};

export function lookupIdent(ident: string): TokenType {
  return keywords[ident] ?? TokenType.Ident;
}
