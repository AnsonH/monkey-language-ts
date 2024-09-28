import {
  BooleanLiteral,
  Expression,
  ExpressionStatement,
  Identifier,
  InfixExpression,
  IntegerLiteral,
  LetStatement,
  PrefixExpression,
  Program,
  ReturnStatement,
  Statement,
} from "./ast.js";
import { NoPrefixParseFunctionError, UnexpectedTokenError } from "./error.js";
import Lexer from "./lexer.js";
import { Token, TokenType } from "./token.js";

/**
 * Parses a prefix operator of `<prefix operator><expression>` (e.g. `-5`).
 */
type PrefixParseFn = () => Expression;

/**
 * Parses an infix operator, which sits between two operands (e.g. `5 + 10`).
 *
 * `this.currentToken` should be at the operator when it is called.
 */
type InfixParseFn = (left: Expression) => Expression;

enum Precedence {
  Lowest = 1,
  Equals, // ==
  LessGreater, // < or >
  Sum, // +
  Product, // *
  Prefix, // -X or !X
  Call, // myFunction(X)
}

const precedences = new Map<TokenType, Precedence>([
  [TokenType.Equal, Precedence.Equals],
  [TokenType.NotEqual, Precedence.Equals],
  [TokenType.LessThan, Precedence.LessGreater],
  [TokenType.GreaterThan, Precedence.LessGreater],
  [TokenType.Plus, Precedence.Sum],
  [TokenType.Minus, Precedence.Sum],
  [TokenType.Slash, Precedence.Product],
  [TokenType.Asterisk, Precedence.Product],
]);

/**
 * A recursive descent parser (aka Pratt parser).
 *
 * It's a top down parser that starts with constructing root node of the AST
 * and then descends.
 *
 * The parser does not store errors, so that it throws parse error directly.
 * This is to keep the parser implementation simple, and there's no point of
 * continuing constructing the AST if there are parse errors.
 */
class Parser {
  lexer: Lexer;

  private currentToken: Token;
  private peekToken: Token;

  private readonly prefixParseFns: Map<TokenType, PrefixParseFn>;
  private readonly infixParseFns: Map<TokenType, InfixParseFn> = new Map();

  constructor(lexer: Lexer) {
    this.lexer = lexer;
    this.currentToken = this.lexer.getNextToken();
    this.peekToken = this.lexer.getNextToken();

    this.prefixParseFns = new Map<TokenType, PrefixParseFn>([
      [TokenType.Ident, this.parseIdentifier.bind(this)],
      [TokenType.Int, this.parseIntegerLiteral.bind(this)],
      [TokenType.Bang, this.parsePrefixExpression.bind(this)],
      [TokenType.Minus, this.parsePrefixExpression.bind(this)],
      [TokenType.True, this.parseBoolean.bind(this)],
      [TokenType.False, this.parseBoolean.bind(this)],
      [TokenType.LParen, this.parseGroupedExpression.bind(this)],
    ]);

    this.infixParseFns = new Map<TokenType, InfixParseFn>([
      [TokenType.Plus, this.parseInfixExpression.bind(this)],
      [TokenType.Minus, this.parseInfixExpression.bind(this)],
      [TokenType.Slash, this.parseInfixExpression.bind(this)],
      [TokenType.Asterisk, this.parseInfixExpression.bind(this)],
      [TokenType.Equal, this.parseInfixExpression.bind(this)],
      [TokenType.NotEqual, this.parseInfixExpression.bind(this)],
      [TokenType.LessThan, this.parseInfixExpression.bind(this)],
      [TokenType.GreaterThan, this.parseInfixExpression.bind(this)],
    ]);
  }

  /**
   * Parses the program and returns an AST.
   *
   * @throws `ParseError` if any syntax error is encountered. There's no point of
   * continuing building the AST so we throw error instead of storing it for later.
   */
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

  /**
   * Assert the next token (`peekToken`) is of the expected type, and consume it
   * if the type is correct.
   */
  private expectPeek(type: TokenType): boolean {
    if (this.isPeekToken(type)) {
      this.nextToken();
      return true;
    } else {
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

  private getCurrentPrecedence(): Precedence {
    return precedences.get(this.currentToken.type) ?? Precedence.Lowest;
  }

  private getPeekPrecedence(): Precedence {
    return precedences.get(this.peekToken.type) ?? Precedence.Lowest;
  }

  private parseStatement(): Statement {
    switch (this.currentToken.type) {
      case TokenType.Let:
        return this.parseLetStatement();
      case TokenType.Return:
        return this.parseReturnStatement();
      default:
        return this.parseExpressionStatement();
    }
  }

  /**
   * Parses an expression statement. Semicolons are optional.
   */
  private parseExpressionStatement(): ExpressionStatement {
    // Use lowest precedence since we didn't parse anything yet and we can't
    // compare precedences.
    const expression = this.parseExpression(Precedence.Lowest);

    if (this.isPeekToken(TokenType.Semicolon)) {
      this.nextToken();
    }

    return { type: "ExpressionStatement", expression };
  }

  /**
   * Parses `let <identifier> = <expression>;`, with current token sitting on
   * `TokenType.Let`.
   *
   * @throws UnexpectedTokenError if the statement is syntactically incorrect.
   */
  private parseLetStatement(): LetStatement {
    if (!this.expectPeek(TokenType.Ident)) {
      throw new UnexpectedTokenError(TokenType.Ident, this.peekToken.type);
    }

    const name: Identifier = {
      type: "Identifier",
      value: this.currentToken.literal,
    };

    if (!this.expectPeek(TokenType.Assign)) {
      throw new UnexpectedTokenError(TokenType.Assign, this.peekToken.type);
    }

    this.nextToken(); // Consume `=`, so currentToken sits on expression
    const value = this.parseExpression(Precedence.Lowest);

    if (this.isPeekToken(TokenType.Semicolon)) {
      this.nextToken();
    }

    return { type: "LetStatement", name, value };
  }

  /**
   * Parses `return <expression>;`, with current token sitting on `TokenType.Return`.
   */
  private parseReturnStatement(): ReturnStatement {
    this.nextToken(); // Consume `return`

    const returnValue = this.parseExpression(Precedence.Lowest);

    if (this.isPeekToken(TokenType.Semicolon)) {
      this.nextToken();
    }

    return { type: "ReturnStatement", returnValue };
  }

  /**
   * Pratt parsing for expressions.
   *
   * @throws NoPrefixParseFunctionError
   */
  private parseExpression(precedence: Precedence): Expression {
    const prefixFn = this.prefixParseFns.get(this.currentToken.type);
    if (!prefixFn) {
      throw new NoPrefixParseFunctionError(this.currentToken.type);
    }
    let leftExp: Expression = prefixFn();

    while (
      !this.isPeekToken(TokenType.Semicolon) &&
      /**
       * If peek operator has higher precedence, associate currentToken with R.H.S.
       * so that currentToken is the left operand of peek operator.
       *
       * parseExpression(Precedence.Sum):
       *     A  +  B  *  C
       *           ^
       *           currentToken
       *
       * Since `* > +`, `B` becomes left operand of `*` -> `A + (B * C)`.
       */
      precedence < this.getPeekPrecedence()
    ) {
      const infixFn = this.infixParseFns.get(this.peekToken.type);
      if (!infixFn) {
        return leftExp;
      }

      this.nextToken();

      // Associate currentToken with R.H.S., so it becomes the left operand of
      // the peek operator
      leftExp = infixFn(leftExp);
    }

    return leftExp;
  }

  private parseBoolean(): BooleanLiteral {
    return {
      type: "BooleanLiteral",
      value: this.isCurrentToken(TokenType.True),
    };
  }

  /**
   * Parses an expression grouped with `( )`, for example `(1 + 2)`.
   *
   * @throws UnexpectedTokenError if the closing `)` is missing.
   */
  private parseGroupedExpression(): Expression {
    this.nextToken(); // Consume `(`

    // Using lowest precedence ensures the whole expression inside `( )` is parsed
    // as a single node
    const expression = this.parseExpression(Precedence.Lowest);

    if (!this.expectPeek(TokenType.RParen)) {
      throw new UnexpectedTokenError(TokenType.RBrace, this.peekToken.type);
    }

    return expression;
  }

  private parseIdentifier(): Identifier {
    return { type: "Identifier", value: this.currentToken.literal };
  }

  private parseInfixExpression(left: Expression): InfixExpression {
    const operator = this.currentToken.literal;
    const precedence = this.getCurrentPrecedence();
    this.nextToken();

    // To make an operator right-associative, try `this.parseExpression(precedence-1)`
    // Right-associative means `a + b + c` = `(a + (b + c))`
    const right = this.parseExpression(precedence);

    return { type: "InfixExpression", operator, left, right };
  }

  private parseIntegerLiteral(): IntegerLiteral {
    return {
      type: "IntegerLiteral",
      value: parseInt(this.currentToken.literal, 10),
    };
  }

  private parsePrefixExpression(): PrefixExpression {
    const operator = this.currentToken.literal;
    this.nextToken(); // Consumes prefix operator -> `currentToken` lands on expression
    const right = this.parseExpression(Precedence.Prefix);

    return { type: "PrefixExpression", operator, right };
  }
}

export default Parser;
