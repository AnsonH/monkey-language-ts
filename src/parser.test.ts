import { describe, expect, test } from "vitest";
import { Program } from "./ast.js";
import Lexer from "./lexer.js";
import Parser from "./parser.js";
import { UnexpectedTokenError } from "./error.js";
import { TokenType } from "./token.js";

function parseProgram(input: string): [Program, Parser] {
  const lexer = new Lexer(input);
  const parser = new Parser(lexer);
  return [parser.parseProgram(), parser];
}

describe("let statements", () => {
  test("valid let statements", () => {
    const input = `let x = 5;
let y = 10;
let foobar = 838383;`;

    const [program] = parseProgram(input);
    const expectedProgram: Program = {
      type: "Program",
      statements: [
        {
          type: "LetStatement",
          name: { type: "Identifier", value: "x" },
          value: null, // TODO: Fix value
        },
        {
          type: "LetStatement",
          name: { type: "Identifier", value: "y" },
          value: null,
        },
        {
          type: "LetStatement",
          name: { type: "Identifier", value: "foobar" },
          value: null,
        },
      ],
    };
    expect(program).toEqual(expectedProgram);
  });

  test("invalid let statements", () => {
    const inputInvalid = `let x 5;
let = 10;
let 838383;
`;
    const [, parser] = parseProgram(inputInvalid);
    expect(parser.getErrors()).toEqual([
      new UnexpectedTokenError(TokenType.Assign, TokenType.Int),
      new UnexpectedTokenError(TokenType.Ident, TokenType.Assign),
      new UnexpectedTokenError(TokenType.Ident, TokenType.Int),
    ]);
  });
});

describe("return statements", () => {
  test("valid return statements", () => {
    const input = `return 5;
return 10;
return 993322;`;

    const [program] = parseProgram(input);
    const expectedProgram: Program = {
      type: "Program",
      statements: [
        {
          type: "ReturnStatement",
          returnValue: null, // TODO: Fix returnValue
        },
        {
          type: "ReturnStatement",
          returnValue: null,
        },
        {
          type: "ReturnStatement",
          returnValue: null,
        },
      ],
    };

    expect(program).toEqual(expectedProgram);
  });
});
