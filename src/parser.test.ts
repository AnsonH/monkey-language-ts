import { describe, expect, test } from "vitest";
import { Program } from "./ast.js";
import Lexer from "./lexer.js";
import Parser from "./parser.js";
import print from "./printer.js";

function parseProgram(input: string): [Program, Parser] {
  const lexer = new Lexer(input);
  const parser = new Parser(lexer);
  return [parser.parseProgram(), parser];
}

function expectNoParseErrors(parser: Parser) {
  expect(parser.getErrors()).toEqual([]);
}

test("valid let statements", () => {
  const input = `let x = 5;
let y = 10;
let foobar = 838383;`;

  const [program] = parseProgram(input);
  expect(program).toEqual<Program>({
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
  });
});

test("valid return statements", () => {
  const input = `return 5;
return 10;
return 993322;`;

  const [program] = parseProgram(input);
  expect(program).toEqual<Program>({
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
  });
});

test("identifier expressions", () => {
  const input = `foobar;`;

  const [program, parser] = parseProgram(input);
  expectNoParseErrors(parser);
  expect(program).toEqual<Program>({
    type: "Program",
    statements: [
      {
        type: "ExpressionStatement",
        expression: { type: "Identifier", value: "foobar" },
      },
    ],
  });
});

test("integer literal expressions", () => {
  const input = "5;";

  const [program, parser] = parseProgram(input);
  expectNoParseErrors(parser);
  expect(program).toEqual<Program>({
    type: "Program",
    statements: [
      {
        type: "ExpressionStatement",
        expression: { type: "IntegerLiteral", value: 5 },
      },
    ],
  });
});

test("prefix expressions", () => {
  const input = "!5; -15; !true; !false;";

  const [program, parser] = parseProgram(input);
  expectNoParseErrors(parser);
  expect(program).toEqual<Program>({
    type: "Program",
    statements: [
      {
        type: "ExpressionStatement",
        expression: {
          type: "PrefixExpression",
          operator: "!",
          right: { type: "IntegerLiteral", value: 5 },
        },
      },
      {
        type: "ExpressionStatement",
        expression: {
          type: "PrefixExpression",
          operator: "-",
          right: { type: "IntegerLiteral", value: 15 },
        },
      },
      {
        type: "ExpressionStatement",
        expression: {
          type: "PrefixExpression",
          operator: "!",
          right: { type: "BooleanLiteral", value: true },
        },
      },
      {
        type: "ExpressionStatement",
        expression: {
          type: "PrefixExpression",
          operator: "!",
          right: { type: "BooleanLiteral", value: false },
        },
      },
    ],
  });
});

describe("infix operators", () => {
  const cases = [
    { input: "5 + 5", description: "adding integers" },
    // { input: "5 - 5", description: "subtracting integers" },
    // { input: "5 * 5", description: "multiplying integers" },
    // { input: "5 / 5", description: "dividing integers" },
    // { input: "5 > 5", description: "integer greater than integer" },
    // { input: "5 < 5", description: "integer less then integer" },
    // { input: "5 == 5", description: "integer equal to integer" },
    // { input: "5 != 5", description: "integer not equal to integer" },
  ];

  cases.forEach(({ input, description }) => {
    test(`${description}: ${input}`, () => {
      const [program, parser] = parseProgram(input);
      expectNoParseErrors(parser);
      expect(program).toEqual<Program>({
        type: "Program",
        statements: [
          {
            type: "ExpressionStatement",
            expression: {
              type: "InfixExpression",
              left: { type: "IntegerLiteral", value: 5 },
              operator: "+",
              right: { type: "IntegerLiteral", value: 5 },
            },
          },
        ],
      });
    });
  });
});

describe("operator precedence", () => {
  const cases: [input: string, expected: string][] = [
    ["-a * b", "((-a) * b);"],
    ["!-a", "(!(-a));"],
    ["a + b + c", "((a + b) + c);"],
    ["a + b - c", "((a + b) - c);"],
    ["a * b * c", "((a * b) * c);"],
    ["a * b / c", "((a * b) / c);"],
    ["a + b / c", "(a + (b / c));"],
    ["a + b * c + d / e - f", "(((a + (b * c)) + (d / e)) - f);"],
    ["3 + 4; -5 * 5", "(3 + 4);\n((-5) * 5);"],
    ["5 > 4 == 3 < 4", "((5 > 4) == (3 < 4));"],
    ["5 < 4 != 3 > 4", "((5 < 4) != (3 > 4));"],
    ["3 + 4 * 5 == 3 * 1 + 4 * 5", "((3 + (4 * 5)) == ((3 * 1) + (4 * 5)));"],
    ["true", "true;"],
    ["false", "false;"],
    ["3 > 5 == false", "((3 > 5) == false);"],

    // Grouped expressions
    ["1 + (2 + 3) + 4", "((1 + (2 + 3)) + 4);"],
    ["(5 + 5) * 2", "((5 + 5) * 2);"],
    ["2 / (5 + 5)", "(2 / (5 + 5));"],
    ["-(5 + 5)", "(-(5 + 5));"],
    ["!(true == true)", "(!(true == true));"],
  ];

  cases.forEach(([input, expected]) => {
    test(`${input}`, () => {
      const [program, parser] = parseProgram(input);
      expectNoParseErrors(parser);
      expect(print(program)).toBe(expected);
    });
  });
});

describe("boolean literals", () => {
  test("true", () => {
    const [program, parser] = parseProgram("true;");
    expectNoParseErrors(parser);
    expect(program).toEqual<Program>({
      type: "Program",
      statements: [
        {
          type: "ExpressionStatement",
          expression: { type: "BooleanLiteral", value: true },
        },
      ],
    });
  });

  test("false", () => {
    const [program, parser] = parseProgram("false;");
    expectNoParseErrors(parser);
    expect(program).toEqual<Program>({
      type: "Program",
      statements: [
        {
          type: "ExpressionStatement",
          expression: { type: "BooleanLiteral", value: false },
        },
      ],
    });
  });
});
