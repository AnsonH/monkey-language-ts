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
  String = "STRING", // "foo"

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
  Colon = ":",
  Semicolon = ";",

  // Brackets
  LParen = "(",
  RParen = ")",
  LBrace = "{",
  RBrace = "}",
  LBracket = "[",
  RBracket = "]",

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
