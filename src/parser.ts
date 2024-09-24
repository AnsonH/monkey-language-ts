import {
  Identifier,
  LetStatement,
  Program,
  ReturnStatement,
  Statement,
} from "./ast.js";
import { ParseError, UnexpectedTokenError } from "./error.js";
import Lexer from "./lexer.js";
import { Token, TokenType } from "./token.js";

/**
 * A recursive descent parser (aka Pratt parser).
 *
 * It's a top down parser that starts with constructing root node of the AST
 * and then descends.
 */
class Parser {
  lexer: Lexer;
  private currentToken: Token;
  private peekToken: Token;
  private errors: ParseError[] = [];

  constructor(lexer: Lexer) {
    this.lexer = lexer;
    this.currentToken = this.lexer.getNextToken();
    this.peekToken = this.lexer.getNextToken();
  }

  parseProgram(): Program {
    const statements: Statement[] = [];

    while (!this.isCurrentToken(TokenType.Eof)) {
      const statement = this.parseStatement();
      if (statement) {
        statements.push(statement);
      }
      this.nextToken();
    }

    return { type: "Program", statements };
  }

  getErrors(): ParseError[] {
    return this.errors;
  }

  /**
   * Assert the next token (`peekToken`) is of the expected type, and consume it
   * if the type is correct.
   */
  private expectPeek(type: TokenType): boolean {
    if (this.isPeekToken(type)) {
      this.nextToken();
      return true;
    } else {
      this.errors.push(new UnexpectedTokenError(type, this.peekToken.type));
      return false;
    }
  }

  private isCurrentToken(type: TokenType): boolean {
    return this.currentToken.type === type;
  }

  private isPeekToken(type: TokenType): boolean {
    return this.peekToken.type === type;
  }

  private nextToken(): void {
    this.currentToken = this.peekToken;
    this.peekToken = this.lexer.getNextToken();
  }

  private parseStatement(): Statement | null {
    switch (this.currentToken.type) {
      case TokenType.Let:
        return this.parseLetStatement();
      case TokenType.Return:
        return this.parseReturnStatement();
      default:
        return null;
    }
  }

  /**
   * Parses `let <identifier> = <expression>;`, with current token sitting on
   * `TokenType.Let`.
   */
  private parseLetStatement(): LetStatement | null {
    if (!this.expectPeek(TokenType.Ident)) {
      return null;
    }

    const name: Identifier = {
      type: "Identifier",
      value: this.currentToken.literal,
    };

    if (!this.expectPeek(TokenType.Assign)) {
      return null;
    }

    // TODO: We're skipping the expressions until we encounter a semicolon
    while (!this.isCurrentToken(TokenType.Semicolon)) {
      this.nextToken();
    }

    return {
      type: "LetStatement",
      name,
      value: null, // TODO
    };
  }

  /**
   * Parses `return <expression>;`, with current token sitting on `TokenType.Return`.
   */
  private parseReturnStatement(): ReturnStatement | null {
    this.nextToken();

    // TODO: We're skipping the expressions until we encounter a semicolon
    while (!this.isCurrentToken(TokenType.Semicolon)) {
      this.nextToken();
    }

    return {
      type: "ReturnStatement",
      returnValue: null, // TODO
    };
  }
}

export default Parser;
