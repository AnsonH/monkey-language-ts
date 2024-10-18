import { lookupIdent, Token, TokenType } from "./token.js";

/**
 * ASCII code for "NUL", which means either "we haven't read anything yet" or
 * "end of file".
 */
const NULL = "\0";

function newToken(tokenType: TokenType, ch: string): Token {
  return { type: tokenType, literal: ch };
}

function isLetter(ch: string): boolean {
  return ("a" <= ch && ch <= "z") || ("A" <= ch && ch <= "Z") || ch === "_";
}

function isDigit(ch: string): boolean {
  return "0" <= ch && ch <= "9";
}

/**
 * Lexer tokenizes an input string into a sequence of tokens.
 *
 * Limitations:
 * - Identifiers can only be alphabet letters (a-z, A-Z) and underscores.
 * - It only supports parsing ASCII characters. UTF-8 is not supported since
 *  characters could be multiple bytes long.
 * - Floats, hexadecimals, and octal numbers are not supported.
 *
 * @example
 * const lexer = new Lexer('let five = 5;');
 * for (let i = 0; i < 5; i++) {
 *   console.log(lexer.getNextToken());
 * }
 * // { type: TokenType.Let, literal: 'let' }
 * // { type: TokenType.Ident, literal: 'five' }
 * // { type: TokenType.Assign, literal: '=' }
 * // { type: TokenType.Int, literal: '5' }
 * // { type: TokenType.Semicolon, literal: ';' }
 */
class Lexer {
  private input: string;
  /**
   * Current position in input (points to current char).
   */
  private position = 0;
  /**
   * Current reading position in input (after current char).
   *
   * This second pointer allows us to look after the current character.
   */
  private readPosition = 0;
  /**
   * Current char under examination.
   */
  private ch = "";

  constructor(input: string) {
    this.input = input;
    this.readChar();
  }

  /**
   * Get the next token from the input.
   *
   * @example
   * const lexer = new Lexer('let five = 5;');
   * lexer.getNextToken(); // { type: TokenType.Let, literal: 'let' }
   */
  getNextToken(): Token {
    let token: Token;

    this.skipWhitespace();

    switch (this.ch) {
      case "=":
        // Check for `==`
        if (this.peekChar() === "=") {
          const ch = this.ch;
          this.readChar();
          token = newToken(TokenType.Equal, ch + this.ch);
        } else {
          token = newToken(TokenType.Assign, this.ch);
        }
        break;
      case "!":
        // Check for `!=`
        if (this.peekChar() === "=") {
          const ch = this.ch;
          this.readChar();
          token = newToken(TokenType.NotEqual, ch + this.ch);
        } else {
          token = newToken(TokenType.Bang, this.ch);
        }
        break;
      case "+":
        token = newToken(TokenType.Plus, this.ch);
        break;
      case "-":
        token = newToken(TokenType.Minus, this.ch);
        break;
      case "/":
        token = newToken(TokenType.Slash, this.ch);
        break;
      case "*":
        token = newToken(TokenType.Asterisk, this.ch);
        break;
      case "<":
        token = newToken(TokenType.LessThan, this.ch);
        break;
      case ">":
        token = newToken(TokenType.GreaterThan, this.ch);
        break;
      case ";":
        token = newToken(TokenType.Semicolon, this.ch);
        break;
      case ",":
        token = newToken(TokenType.Comma, this.ch);
        break;
      case "(":
        token = newToken(TokenType.LParen, this.ch);
        break;
      case ")":
        token = newToken(TokenType.RParen, this.ch);
        break;
      case "{":
        token = newToken(TokenType.LBrace, this.ch);
        break;
      case "}":
        token = newToken(TokenType.RBrace, this.ch);
        break;
      case "[":
        token = newToken(TokenType.LBracket, this.ch);
        break;
      case "]":
        token = newToken(TokenType.RBracket, this.ch);
        break;
      case NULL:
        token = newToken(TokenType.Eof, "");
        break;
      case '"':
        token = newToken(TokenType.String, this.readString());
        break;
      default:
        if (isLetter(this.ch)) {
          const literal = this.readIdentifier();
          return newToken(lookupIdent(literal), literal);
        } else if (isDigit(this.ch)) {
          const number = this.readNumber();
          return newToken(TokenType.Int, number);
        } else {
          token = newToken(TokenType.Illegal, this.ch);
        }
    }

    this.readChar();
    return token;
  }

  /**
   * Moves the lexer's position forward by one character.
   */
  private readChar(): void {
    if (this.readPosition >= this.input.length) {
      this.ch = NULL;
    } else {
      // NOTE: This won't work with UTF-8 characters since they could be multiple bytes long
      this.ch = this.input[this.readPosition];
    }
    this.position = this.readPosition;
    ++this.readPosition;
  }

  /**
   * Peeks the next character without advancing the lexer's position.
   *
   * Useful for parsing two-character operators like `==`, `!=`.
   */
  private peekChar(): string {
    if (this.readPosition >= this.input.length) {
      return NULL;
    } else {
      return this.input[this.readPosition];
    }
  }

  /**
   * Reads an identifier/keyword and advances the lexer's position.
   */
  private readIdentifier(): string {
    const startPosition = this.position;
    while (isLetter(this.ch)) {
      this.readChar();
    }
    return this.input.substring(startPosition, this.position);
  }

  private readNumber(): string {
    const startPosition = this.position;
    while (isDigit(this.ch)) {
      this.readChar();
    }
    return this.input.substring(startPosition, this.position);
  }

  private readString(): string {
    const startPosition = this.position + 1;

    while (true) {
      this.readChar();
      if (this.ch === '"' || this.ch === NULL) {
        break;
      }
    }

    return this.input.substring(startPosition, this.position);
  }

  private skipWhitespace(): void {
    while (
      this.ch === " " ||
      this.ch === "\t" ||
      this.ch === "\n" ||
      this.ch === "\r"
    ) {
      this.readChar();
    }
  }
}

export default Lexer;
