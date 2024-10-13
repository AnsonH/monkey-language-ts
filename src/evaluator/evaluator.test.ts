import { describe, expect, test } from "vitest";
import Lexer from "../lexer/lexer.js";
import Parser from "../parser/parser.js";
import { evaluate } from "./evaluator.js";
import { Integer, MBoolean, MObject, Null } from "./object.js";
import { TypeMismatchError, UnknownOperatorError } from "./error.js";

function evaluateProgram(input: string): MObject {
  const lexer = new Lexer(input);
  const parser = new Parser(lexer);
  const program = parser.parseProgram();
  return evaluate(program);
}

describe("integer expressions", () => {
  const testCases: [input: string, expected: number][] = [
    ["0", 0],
    ["5", 5],
    ["10", 10],
    ["-5", -5],
    ["-10", -10],
    ["5 + 5 + 5 + 5 - 10", 10],
    ["2 * 2 * 2 * 2 * 2", 32],
    ["-50 + 100 + -50", 0],
    ["5 * 2 + 10", 20],
    ["5 + 2 * 10", 25],
    ["20 + 2 * -10", 0],
    ["50 / 2 * 2 + 10", 60],
    ["2 * (5 + 10)", 30],
    ["3 * 3 * 3 + 10", 37],
    ["3 * (3 * 3) + 10", 37],
    ["(5 + 10 * 2 + 15 / 3) * 2 + -10", 50],
  ];

  testCases.forEach(([input, expected]) => {
    test(`${input} should evaluate to ${expected}`, () => {
      const output = evaluateProgram(input);
      expect(output).toBeInstanceOf(Integer);
      expect((output as Integer).value).toBe(expected);
    });
  });
});

describe("boolean expressions", () => {
  const testCases: [input: string, expected: boolean][] = [
    ["true", true],
    ["false", false],

    // Integer comparison
    ["1 < 2", true],
    ["1 > 2", false],
    ["1 < 1", false],
    ["1 > 1", false],
    ["1 == 1", true],
    ["1 != 1", false],
    ["1 == 2", false],
    ["1 != 2", true],

    // Boolean comparison
    ["true == true", true],
    ["false == false", true],
    ["true == false", false],
    ["true != false", true],
    ["false != true", true],
    ["(1 < 2) == true", true],
    ["(1 < 2) == false", false],
    ["(1 > 2) == true", false],
    ["(1 > 2) == false", true],
  ];

  testCases.forEach(([input, expected]) => {
    test(`${input} should evaluate to ${expected}`, () => {
      const output = evaluateProgram(input);
      expect(output).toBeInstanceOf(MBoolean);
      expect((output as MBoolean).value).toBe(expected);
    });
  });
});

describe("bang infix operator", () => {
  const testCases: [input: string, expected: boolean][] = [
    ["!true", false],
    ["!false", true],
    ["!5", false],
    ["!!true", true],
    ["!!false", false],
    ["!!5", true],
  ];

  testCases.forEach(([input, expected]) => {
    test(`${input} should evaluate to ${expected}`, () => {
      const output = evaluateProgram(input);
      expect(output).toBeInstanceOf(MBoolean);
      expect((output as MBoolean).value).toBe(expected);
    });
  });
});

describe("if else expressions", () => {
  const cases = [
    {
      input: "if (true) { 10 }",
      expected: 10,
      description: "literal true condition",
    },
    {
      input: "if (false) { 10 }",
      description: "literal false condition",
    },
    {
      input: "if (1) { 10 }",
      expected: 10,
      description: "truthy condition",
    },
    {
      input: "if (1 < 2) { 10 }",
      expected: 10,
      description: "condition expression that evaluates to true",
    },
    {
      input: "if (1 > 2) { 10 }",
      description: "condition expression that evaluates to false",
    },
    {
      input: "if (1 < 2) { 10 } else { 20 }",
      expected: 10,
      description: "true condition with alternative",
    },
    {
      input: "if (1 > 2) { 10 } else { 20 }",
      expected: 20,
      description: "false condition with alternative",
    },
  ];

  cases.forEach(({ input, expected, description }) => {
    test(`${description}: ${input}`, () => {
      const result = evaluateProgram(input);

      if (expected) {
        expect(result).toEqual(new Integer(expected));
      } else {
        expect(result).toBeInstanceOf(Null);
      }
    });
  });
});

describe("return statements", () => {
  const cases = [
    {
      input: "return 10;",
      expected: 10,
      description: "return a literal",
    },
    {
      input: "return 10; 9;",
      expected: 10,
      description: "return before another statement",
    },
    {
      input: "return 2 * 5; 9;",
      expected: 10,
      description: "return an expression",
    },
    {
      input: "9; return 2 * 5; 9;",
      expected: 10,
      description: "return between two other statements",
    },
    {
      input: `
        if (10 > 1) {
          if (8 > 1) {
            return 10;
          }
          return 1;
        }
      `,
      expected: 10,
      description: "returning in a nested block statement",
    },
  ];

  cases.forEach(({ input, expected, description }) => {
    test(`${description}`, () => {
      const result = evaluateProgram(input);
      expect(result).toBeInstanceOf(Integer);
      expect((result as Integer).value).toBe(expected);
    });
  });
});

describe("error handling", () => {
  const cases = [
    {
      input: "5 + true;",
      expected: new TypeMismatchError("5 + true"),
      description: "infix operator type mismatch",
    },
    {
      input: "5 + true; 5;",
      expected: new TypeMismatchError("5 + true"),
      description: "type mismatch before another valid statement",
    },
    {
      input: "-true",
      expected: new UnknownOperatorError("-true"),
      description: "minus prefix unknown operator",
    },
    {
      input: "!(5 > true)",
      expected: new TypeMismatchError("5 > true"),
      description: "type mismatch in prefix expression",
    },
    {
      input: "true + false;",
      expected: new UnknownOperatorError("true + false"),
      description: "unknown infix operator",
    },
    {
      input: "5 + (true + false);",
      expected: new UnknownOperatorError("true + false"),
      description: "invalid expression in right side of infix operator",
    },
    {
      input: "5; true + false; 5",
      expected: new UnknownOperatorError("true + false"),
      description: "error between two valid statements",
    },
    {
      input: "if (10 > 1) { true + false; }",
      expected: new UnknownOperatorError("true + false"),
      description: "error inside a block statement",
    },
    {
      input: "if (true > 1) { 10 }",
      expected: new TypeMismatchError("true > 1"),
      description: "error in if expression condition",
    },
    {
      input: `
        if (10 > 1) {
          if (8 > 1) {
            return true + false;
          }
          return 1;
        }
      `,
      expected: new UnknownOperatorError("true + false"),
      description: "error in the return of a nested block statement",
    },
    {
      input: "return (true + false);",
      expected: new UnknownOperatorError("true + false"),
      description: "error in returned expression",
    },
  ];

  cases.forEach(({ input, expected, description }) => {
    test(`${description}`, () => {
      const result = evaluateProgram(input);
      expect(result).toEqual(expected);
    });
  });
});
