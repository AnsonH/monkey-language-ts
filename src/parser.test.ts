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

describe("let statements", () => {
  test("valid let statements", () => {
    const input = `let x = 5;
  let foobar = 838383;`;

    const [program] = parseProgram(input);
    expect(program).toEqual<Program>({
      type: "Program",
      statements: [
        {
          type: "LetStatement",
          name: { type: "Identifier", value: "x" },
          value: { type: "IntegerLiteral", value: 5 },
        },
        {
          type: "LetStatement",
          name: { type: "Identifier", value: "foobar" },
          value: { type: "IntegerLiteral", value: 838383 },
        },
      ],
    });
  });

  test("invalid test statements", () => {
    const invalidInputs = ["let x 5;", "let = 5;", "let x = "];
    invalidInputs.forEach((input) => {
      expect(() => parseProgram(input)).toThrowError();
    });
  });
});

test("return statements", () => {
  const input = `return 5;
return 993322;`;

  const [program] = parseProgram(input);
  expect(program).toEqual<Program>({
    type: "Program",
    statements: [
      {
        type: "ReturnStatement",
        returnValue: { type: "IntegerLiteral", value: 5 },
      },
      {
        type: "ReturnStatement",
        returnValue: { type: "IntegerLiteral", value: 993322 },
      },
    ],
  });
});

test("identifier expressions", () => {
  const input = `foobar;`;

  const [program] = parseProgram(input);
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

  const [program] = parseProgram(input);
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

  const [program] = parseProgram(input);
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

// TODO: Use Vitest snapshots
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
      const [program] = parseProgram(input);
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
      const [program] = parseProgram(input);
      expect(print(program)).toBe(expected);
    });
  });
});

describe("boolean literals", () => {
  test("true", () => {
    const [program] = parseProgram("true;");
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
    const [program] = parseProgram("false;");
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

describe("if expressions", () => {
  test("if expression without else", () => {
    const input = "if (x < y) { x }";
    const [program] = parseProgram(input);
    expect(program).toEqual<Program>({
      type: "Program",
      statements: [
        {
          type: "ExpressionStatement",
          expression: {
            type: "IfExpression",
            condition: {
              type: "InfixExpression",
              left: { type: "Identifier", value: "x" },
              operator: "<",
              right: { type: "Identifier", value: "y" },
            },
            consequence: {
              type: "BlockStatement",
              statements: [
                {
                  type: "ExpressionStatement",
                  expression: { type: "Identifier", value: "x" },
                },
              ],
            },
            alternative: null,
          },
        },
      ],
    });
  });

  test("if expression with else", () => {
    const input = "if (x < y) { x } else { y }";
    const [program] = parseProgram(input);
    expect(program).toEqual<Program>({
      type: "Program",
      statements: [
        {
          type: "ExpressionStatement",
          expression: {
            type: "IfExpression",
            condition: {
              type: "InfixExpression",
              left: { type: "Identifier", value: "x" },
              operator: "<",
              right: { type: "Identifier", value: "y" },
            },
            consequence: {
              type: "BlockStatement",
              statements: [
                {
                  type: "ExpressionStatement",
                  expression: { type: "Identifier", value: "x" },
                },
              ],
            },
            alternative: {
              type: "BlockStatement",
              statements: [
                {
                  type: "ExpressionStatement",
                  expression: { type: "Identifier", value: "y" },
                },
              ],
            },
          },
        },
      ],
    });
  });
});
