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

describe("infix operators", () => {
  const cases = [
    { input: "5 + 5", operator: "+", description: "adding integers" },
    { input: "5 - 5", operator: "-", description: "subtracting integers" },
    { input: "5 * 5", operator: "*", description: "multiplying integers" },
    { input: "5 / 5", operator: "/", description: "dividing integers" },
    {
      input: "5 > 5",
      operator: ">",
      description: "integer greater than integer",
    },
    { input: "5 < 5", operator: "<", description: "integer less than integer" },
    {
      input: "5 == 5",
      operator: "==",
      description: "integer equal to integer",
    },
    {
      input: "5 != 5",
      operator: "!=",
      description: "integer not equal to integer",
    },
  ];

  cases.forEach(({ input, operator, description }) => {
    test(`${description}`, () => {
      const [program] = parseProgram(input);
      expect(program).toEqual<Program>({
        type: "Program",
        statements: [
          {
            type: "ExpressionStatement",
            expression: {
              type: "InfixExpression",
              left: { type: "IntegerLiteral", value: 5 },
              operator,
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

    // Index expressions have higher precedence than infix expressions
    ["a * [1, 2, 3, 4][b * c] * d", "((a * ([1, 2, 3, 4][(b * c)])) * d);"],
    [
      "add(a * b[2], b[1], 2 * [1, 2][1])",
      "add((a * (b[2])), (b[1]), (2 * ([1, 2][1])));",
    ],
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

describe("array literals", () => {
  test("empty array", () => {
    const input = "[]";
    const [program] = parseProgram(input);
    expect(program).toEqual<Program>({
      type: "Program",
      statements: [
        {
          type: "ExpressionStatement",
          expression: { type: "ArrayLiteral", elements: [] },
        },
      ],
    });
  });

  test("array with single element", () => {
    const input = "[1]";
    const [program] = parseProgram(input);
    expect(program).toEqual<Program>({
      type: "Program",
      statements: [
        {
          type: "ExpressionStatement",
          expression: {
            type: "ArrayLiteral",
            elements: [{ type: "IntegerLiteral", value: 1 }],
          },
        },
      ],
    });
  });

  test("array with multiple elements of mixed type", () => {
    const input = '[1, "two", 3 + 4]';
    const [program] = parseProgram(input);
    expect(program).toEqual<Program>({
      type: "Program",
      statements: [
        {
          type: "ExpressionStatement",
          expression: {
            type: "ArrayLiteral",
            elements: [
              { type: "IntegerLiteral", value: 1 },
              { type: "StringLiteral", value: "two" },
              {
                type: "InfixExpression",
                left: { type: "IntegerLiteral", value: 3 },
                operator: "+",
                right: { type: "IntegerLiteral", value: 4 },
              },
            ],
          },
        },
      ],
    });
  });
});

test("index expressions", () => {
  const input = "myArray[1 + 1]";
  const [program] = parseProgram(input);
  expect(program).toEqual<Program>({
    type: "Program",
    statements: [
      {
        type: "ExpressionStatement",
        expression: {
          type: "IndexExpression",
          left: { type: "Identifier", value: "myArray" },
          index: {
            type: "InfixExpression",
            left: { type: "IntegerLiteral", value: 1 },
            operator: "+",
            right: { type: "IntegerLiteral", value: 1 },
          },
        },
      },
    ],
  });
});

describe("hash literals", () => {
  test("string keys", () => {
    const input = '{"one": 1, "two": 2, "three": 3}';
    const [program] = parseProgram(input);
    expect(program).toEqual<Program>({
      type: "Program",
      statements: [
        {
          type: "ExpressionStatement",
          expression: {
            type: "HashLiteral",
            pairs: new Map([
              [
                { type: "StringLiteral", value: "one" },
                { type: "IntegerLiteral", value: 1 },
              ],
              [
                { type: "StringLiteral", value: "two" },
                { type: "IntegerLiteral", value: 2 },
              ],
              [
                { type: "StringLiteral", value: "three" },
                { type: "IntegerLiteral", value: 3 },
              ],
            ]),
          },
        },
      ],
    });
  });

  test("empty hash literal", () => {
    const input = "{}";
    const [program] = parseProgram(input);
    expect(program).toEqual<Program>({
      type: "Program",
      statements: [
        {
          type: "ExpressionStatement",
          expression: { type: "HashLiteral", pairs: new Map() },
        },
      ],
    });
  });

  test("values as expressions", () => {
    const input = '{"one": 0 + 1, "two": 10 - 8, "three": 15 / 5}';
    const [program] = parseProgram(input);
    expect(program).toEqual<Program>({
      type: "Program",
      statements: [
        {
          type: "ExpressionStatement",
          expression: {
            type: "HashLiteral",
            pairs: new Map([
              [
                { type: "StringLiteral", value: "one" },
                {
                  type: "InfixExpression",
                  left: { type: "IntegerLiteral", value: 0 },
                  operator: "+",
                  right: { type: "IntegerLiteral", value: 1 },
                },
              ],
              [
                { type: "StringLiteral", value: "two" },
                {
                  type: "InfixExpression",
                  left: { type: "IntegerLiteral", value: 10 },
                  operator: "-",
                  right: { type: "IntegerLiteral", value: 8 },
                },
              ],
              [
                { type: "StringLiteral", value: "three" },
                {
                  type: "InfixExpression",
                  left: { type: "IntegerLiteral", value: 15 },
                  operator: "/",
                  right: { type: "IntegerLiteral", value: 5 },
                },
              ],
            ]),
          },
        },
      ],
    });
  });

  test("keys as non-string expressions", () => {
    const input = '{1: "one", true: 2, fooBar: 3}';
    const [program] = parseProgram(input);
    expect(program).toEqual<Program>({
      type: "Program",
      statements: [
        {
          type: "ExpressionStatement",
          expression: {
            type: "HashLiteral",
            pairs: new Map([
              [
                { type: "IntegerLiteral", value: 1 },
                { type: "StringLiteral", value: "one" },
              ],
              [
                { type: "BooleanLiteral", value: true },
                { type: "IntegerLiteral", value: 2 },
              ],
              [
                { type: "Identifier", value: "fooBar" },
                { type: "IntegerLiteral", value: 3 },
              ],
            ]),
          },
        },
      ],
    });
  });
});
