import { describe, expect, test } from "vitest";
import Lexer from "../lexer/lexer.js";
import { Program } from "./ast.js";
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

    // Call expressions have highest precedence
    ["a + add(b * c) + d", "((a + add((b * c))) + d);"],
    [
      "add(a, b, 1, 2 * 3, 4 + 5, add(6, 7 * 8))",
      "add(a, b, 1, (2 * 3), (4 + 5), add(6, (7 * 8)));",
    ],
    ["add(a + b + c * d / f + g)", "add((((a + b) + ((c * d) / f)) + g));"],
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

describe("function literals", () => {
  test("with no parameter", () => {
    const input = "fn() { 5 }";
    const [program] = parseProgram(input);
    expect(program).toEqual<Program>({
      type: "Program",
      statements: [
        {
          type: "ExpressionStatement",
          expression: {
            type: "FunctionLiteral",
            parameters: [],
            body: {
              type: "BlockStatement",
              statements: [
                {
                  type: "ExpressionStatement",
                  expression: { type: "IntegerLiteral", value: 5 },
                },
              ],
            },
          },
        },
      ],
    });
  });

  test("with one parameter", () => {
    const input = "fn(x) { x }";
    const [program] = parseProgram(input);
    expect(program).toEqual<Program>({
      type: "Program",
      statements: [
        {
          type: "ExpressionStatement",
          expression: {
            type: "FunctionLiteral",
            parameters: [{ type: "Identifier", value: "x" }],
            body: {
              type: "BlockStatement",
              statements: [
                {
                  type: "ExpressionStatement",
                  expression: { type: "Identifier", value: "x" },
                },
              ],
            },
          },
        },
      ],
    });
  });

  test("with multiple parameters", () => {
    const input = "fn(x, y, z) { return x + y; }";
    const [program] = parseProgram(input);
    expect(program).toEqual<Program>({
      type: "Program",
      statements: [
        {
          type: "ExpressionStatement",
          expression: {
            type: "FunctionLiteral",
            parameters: [
              { type: "Identifier", value: "x" },
              { type: "Identifier", value: "y" },
              { type: "Identifier", value: "z" },
            ],
            body: {
              type: "BlockStatement",
              statements: [
                {
                  type: "ReturnStatement",
                  returnValue: {
                    type: "InfixExpression",
                    left: { type: "Identifier", value: "x" },
                    operator: "+",
                    right: { type: "Identifier", value: "y" },
                  },
                },
              ],
            },
          },
        },
      ],
    });
  });
});

describe("call expressions", () => {
  test("function identifier call with no args", () => {
    const input = "f()";
    const [program] = parseProgram(input);
    expect(program).toEqual<Program>({
      type: "Program",
      statements: [
        {
          type: "ExpressionStatement",
          expression: {
            type: "CallExpression",
            function: { type: "Identifier", value: "f" },
            arguments: [],
          },
        },
      ],
    });
  });

  test("function identifier call with one arg", () => {
    const input = "f(1 + 2)";
    const [program] = parseProgram(input);
    expect(program).toEqual<Program>({
      type: "Program",
      statements: [
        {
          type: "ExpressionStatement",
          expression: {
            type: "CallExpression",
            function: { type: "Identifier", value: "f" },
            arguments: [
              {
                type: "InfixExpression",
                left: { type: "IntegerLiteral", value: 1 },
                operator: "+",
                right: { type: "IntegerLiteral", value: 2 },
              },
            ],
          },
        },
      ],
    });
  });

  test("function identifier call with multiple args", () => {
    const input = "f(a, b + c, d)";
    const [program] = parseProgram(input);
    expect(program).toEqual<Program>({
      type: "Program",
      statements: [
        {
          type: "ExpressionStatement",
          expression: {
            type: "CallExpression",
            function: { type: "Identifier", value: "f" },
            arguments: [
              { type: "Identifier", value: "a" },
              {
                type: "InfixExpression",
                left: { type: "Identifier", value: "b" },
                operator: "+",
                right: { type: "Identifier", value: "c" },
              },
              { type: "Identifier", value: "d" },
            ],
          },
        },
      ],
    });
  });

  test("function literal call", () => {
    const input = "fn(x){ x }(1)";
    const [program] = parseProgram(input);
    expect(program).toEqual<Program>({
      type: "Program",
      statements: [
        {
          type: "ExpressionStatement",
          expression: {
            type: "CallExpression",
            function: {
              type: "FunctionLiteral",
              parameters: [{ type: "Identifier", value: "x" }],
              body: {
                type: "BlockStatement",
                statements: [
                  {
                    type: "ExpressionStatement",
                    expression: { type: "Identifier", value: "x" },
                  },
                ],
              },
            },
            arguments: [{ type: "IntegerLiteral", value: 1 }],
          },
        },
      ],
    });
  });
});

test("string literals", () => {
  const input = '"hello world"';
  const [program] = parseProgram(input);
  expect(program).toEqual<Program>({
    type: "Program",
    statements: [
      {
        type: "ExpressionStatement",
        expression: { type: "StringLiteral", value: "hello world" },
      },
    ],
  });
});
