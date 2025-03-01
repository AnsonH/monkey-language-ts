import { describe, expect, it, test } from "vitest";
import Lexer from "../lexer/lexer.js";
import { BlockStatement, Identifier } from "../parser/ast.js";
import Parser from "../parser/parser.js";
import Environment from "./environment.js";
import {
  ArgumentNotSupportedError,
  ArgumentWrongNumberError,
  IdentifierNotFoundError,
  IndexOperatorNotSupported,
  InvalidHashKeyError,
  TypeMismatchError,
  UnknownOperatorError,
} from "./error.js";
import { evaluate, NULL } from "./evaluator.js";
import {
  Hash,
  HashPair,
  Integer,
  MArray,
  MBoolean,
  MFunction,
  MObject,
  MString,
  Null,
} from "./object.js";

function evaluateProgram(input: string): MObject {
  const env = new Environment();
  const lexer = new Lexer(input);
  const parser = new Parser(lexer);
  const program = parser.parseProgram();
  return evaluate(program, env);
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
    // Type mismatch and unknown operator
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
    {
      input: '"Hello" - "World!"',
      expected: new UnknownOperatorError('"Hello" - "World!"'),
      description: "unknown string infix operator",
    },

    // Identifier
    {
      input: "foobar",
      expected: new IdentifierNotFoundError("foobar"),
      description: "unknown identifier",
    },

    // Index expression
    {
      input: '"Hello"[0]',
      expected: new IndexOperatorNotSupported('"Hello"'),
      description: "unsupported index expression",
    },

    // Hash literal
    {
      input: "{ fn(x) { x }: 5}",
      expected: new InvalidHashKeyError("fn(x) {\n  x;\n}"),
      description: "invalid hash key type",
    },
    {
      input: '{"name": "Monkey"}[fn(x) { x }];',
      expected: new InvalidHashKeyError("fn(x) {\n  x;\n}"),
      description: "invalid hash value type",
    },
  ];

  cases.forEach(({ input, expected, description }) => {
    test(`${description}`, () => {
      const result = evaluateProgram(input);
      expect(result).toEqual(expected);
    });
  });
});

describe("let statements", () => {
  const cases = [
    {
      input: "let a = 5; a;",
      expected: 5,
      description: "assigning an integer literal",
    },
    {
      input: "let a = 5 * 5; a;",
      expected: 25,
      description: "assigning an infix expression",
    },
    {
      input: "let a = 5; let b = a; a;",
      expected: 5,
      description: "assigning the value of another identifier",
    },
    {
      input: "let a = 5; let b = a; let c = a + b + 5; c;",
      expected: 15,
      description: "assigning an expression using multiple identifiers",
    },
  ];

  cases.forEach(({ input, expected, description }) => {
    test(`${description}`, () => {
      const result = evaluateProgram(input);
      expect((result as Integer).value).toBe(expected);
    });
  });
});

describe("function literals", () => {
  const input = "fn(x) { x + 2; };";
  const result = evaluateProgram(input);

  it("is an instance of MFunction", () => {
    expect(result).toBeInstanceOf(MFunction);
  });

  it("has correct parameters", () => {
    expect((result as MFunction).parameters).toEqual<Identifier[]>([
      { type: "Identifier", value: "x" },
    ]);
  });

  it("has correct body", () => {
    expect((result as MFunction).body).toEqual<BlockStatement>({
      type: "BlockStatement",
      statements: [
        {
          type: "ExpressionStatement",
          expression: {
            type: "InfixExpression",
            left: { type: "Identifier", value: "x" },
            operator: "+",
            right: { type: "IntegerLiteral", value: 2 },
          },
        },
      ],
    });
  });
});

describe("function calls", () => {
  const cases = [
    {
      input: "let identity = fn(x) { x; }; identity(5);",
      expected: 5,
      description: "implicit return value",
    },
    {
      input: "let identity = fn(x) { return x; }; identity(5);",
      expected: 5,
      description: "explicit return value",
    },
    {
      input: "let double = fn(x) { x * 2; }; double(5);",
      expected: 10,
      description: "using parameters in expressions",
    },
    {
      input: "let add = fn(x, y) { x + y; }; add(5, 5);",
      expected: 10,
      description: "multiple parameters",
    },
    {
      input: "let add = fn(x, y) { x + y; }; add(5 + 5, add(5, 5));",
      expected: 20,
      description: "evaluating arguments before calling",
    },
    {
      input: "fn(x) { x; }(5)",
      expected: 5,
      description: "immediately invoked function literal",
    },

    // Closures
    {
      input: `
        let x = 5;
        let addOne = fn(x) { x + 1 };
        addOne(10);
      `,
      expected: 11,
      description: 'function parameter shadows outer "x"',
    },
    {
      input: `
        let newAdder = fn(x) {
          fn(y) { x + y };
        };
        let addTwo = newAdder(2);
        addTwo(3);
      `,
      expected: 5,
      description: "higher order function",
    },
    {
      input: `
        let x = 10; 
        let nestedFunc = fn() {
          fn() {
            fn() {
              x;
            }
          }
        }
        nestedFunc()()();
      `,
      expected: 10,
      description: "access deeply nested identifier in outermost environment",
    },
    {
      input: `
        let factorial = fn(n) {
          if (n == 0) {
            return 1;
          } else {
            return n * factorial(n - 1);
          }
        };
        factorial(5);
      `,
      expected: 120,
      description: "recursion",
    },
  ];

  cases.forEach(({ input, expected, description }) => {
    test(`${description}`, () => {
      const result = evaluateProgram(input);
      expect((result as Integer).value).toBe(expected);
    });
  });
});

describe("strings", () => {
  test("literals", () => {
    const input = '"Hello World!"';
    const result = evaluateProgram(input);
    expect(result).toBeInstanceOf(MString);
    expect((result as MString).value).toBe("Hello World!");
  });

  test("concatenation", () => {
    const input = '"Hello" + " " + "World!"';
    const result = evaluateProgram(input);
    expect(result).toBeInstanceOf(MString);
    expect((result as MString).value).toBe("Hello World!");
  });
});

describe("arrays", () => {
  test("literals", () => {
    const input = "[1, 2 * 2, 3 + 3]";
    const result = evaluateProgram(input);
    expect(result).toEqual(
      new MArray([new Integer(1), new Integer(4), new Integer(6)]),
    );
  });

  describe("index expressions", () => {
    const cases = [
      {
        input: "[1, 2, 3][0]",
        expected: new Integer(1),
        description: "index of 0",
      },
      {
        input: "[1, 2, 3][1]",
        expected: new Integer(2),
        description: "index of 1",
      },
      {
        input: "[1, 2, 3][2]",
        expected: new Integer(3),
        description: "index of 2",
      },
      {
        input: "let i = 0; [1][i]",
        expected: new Integer(1),
        description: "identifier as index",
      },
      {
        input: "[1, 2, 3][1 + 1]",
        expected: new Integer(3),
        description: "arithmetic inside index",
      },
      {
        input: "let myArray = [1, 2, 3]; myArray[2]",
        expected: new Integer(3),
        description: "identifier as left side",
      },
      {
        input: "let myArray = [1, 2, 3]; myArray[0] + myArray[1] + myArray[2];",
        expected: new Integer(6),
        description: "used in an expression",
      },
      {
        input: "[0, fn(x, y) { x + y }, 2][1](3, 4)",
        expected: new Integer(7),
        description: "calling a function from an array",
      },
      {
        input: "[1, 2, 3][3]",
        expected: NULL,
        description: "positive out-of-bounds index",
      },
      {
        input: "[1, 2, 3][-1]",
        expected: NULL,
        description: "negative out-of-bounds index",
      },
    ];

    cases.forEach(({ input, expected, description }) => {
      test(`${description}`, () => {
        const result = evaluateProgram(input);
        expect(result).toEqual(expected);
      });
    });
  });
});

describe("hashes", () => {
  /**
   * Asserts the actual hash has the expected pairs, where the order of pairs
   * does not matter.
   *
   * We don't directly assert `actual.pairs` to match `HashPairs`, because the
   * `HashKey` key is an internal mechanism and not exposed to the user.
   */
  const expectHashToHavePairs = (actual: Hash, expected: HashPair[]) => {
    const actualPairs = new Set(actual.pairs.values());
    const expectedPairs = new Set(expected);
    expect(actualPairs).toEqual(expectedPairs);
  };

  test("literals with valid key types", () => {
    const input = `
      let two = "two";
      {
        "one": 10 - 9,
        two: 1 + 1,
        "thr" + "ee": 6 / 2,
        4: 4,
        true: 5,
        false: 6,
      }`;
    const result = evaluateProgram(input);
    expect(result).toBeInstanceOf(Hash);
    expectHashToHavePairs(result as Hash, [
      { key: new MString("one"), value: new Integer(1) },
      { key: new MString("two"), value: new Integer(2) },
      { key: new MString("three"), value: new Integer(3) },
      { key: new Integer(4), value: new Integer(4) },
      { key: new MBoolean(true), value: new Integer(5) },
      { key: new MBoolean(false), value: new Integer(6) },
    ]);
  });

  describe("index expressions", () => {
    const cases = [
      {
        input: '{ "foo": 5 }["foo"]',
        expected: new Integer(5),
        description: "string key",
      },
      {
        input: '{"foo": 5}["bar"]',
        expected: NULL,
        description: "string key that doesn't exist",
      },
      {
        input: 'let key = "foo"; {"foo": 5}[key]',
        expected: new Integer(5),
        description: "identifier as key",
      },
      {
        input: '{}["foo"]',
        expected: NULL,
        description: "index on empty hash",
      },
      {
        input: "{5: 5}[5]",
        expected: new Integer(5),
        description: "integer as key",
      },
      {
        input: "{true: 5}[true]",
        expected: new Integer(5),
        description: "true as key",
      },
      {
        input: "{false: 5}[false]",
        expected: new Integer(5),
        description: "false as key",
      },
    ];

    cases.forEach(({ input, expected, description }) => {
      test(`${description}`, () => {
        const result = evaluateProgram(input);
        expect(result).toEqual(expected);
      });
    });
  });
});

describe("builtin functions", () => {
  describe("len", () => {
    test("empty string returns 0", () => {
      const input = 'len("")';
      const result = evaluateProgram(input);
      expect(result).toBeInstanceOf(Integer);
      expect((result as Integer).value).toBe(0);
    });

    test("non-empty string returns correct length", () => {
      const input = 'len("hello world")';
      const result = evaluateProgram(input);
      expect(result).toBeInstanceOf(Integer);
      expect((result as Integer).value).toBe(11);
    });

    test("empty array returns 0", () => {
      const input = "len([])";
      const result = evaluateProgram(input);
      expect(result).toBeInstanceOf(Integer);
      expect((result as Integer).value).toBe(0);
    });

    test("non-empty array returns correct length", () => {
      const input = "len([1, 2, 3])";
      const result = evaluateProgram(input);
      expect(result).toBeInstanceOf(Integer);
      expect((result as Integer).value).toBe(3);
    });

    test("unsupported argument type", () => {
      const input = "len(1)";
      const result = evaluateProgram(input);
      expect(result).toBeInstanceOf(ArgumentNotSupportedError);
    });

    test("wrong number of arguments", () => {
      const input = 'len("one", "two")';
      const result = evaluateProgram(input);
      expect(result).toEqual(new ArgumentWrongNumberError(1, 2));
    });
  });

  describe("first", () => {
    test("empty array returns null", () => {
      const input = "first([])";
      const result = evaluateProgram(input);
      expect(result).toBe(NULL);
    });

    test("non-empty array returns first element", () => {
      const input = "first([1, 2, 3])";
      const result = evaluateProgram(input);
      expect(result).toEqual(new Integer(1));
    });

    test("unsupported argument type", () => {
      const input = 'first("hello")';
      const result = evaluateProgram(input);
      expect(result).toBeInstanceOf(ArgumentNotSupportedError);
    });

    test("wrong number of arguments", () => {
      const input = 'first([1, 2], "two")';
      const result = evaluateProgram(input);
      expect(result).toEqual(new ArgumentWrongNumberError(1, 2));
    });
  });

  describe("last", () => {
    test("empty array returns null", () => {
      const input = "last([])";
      const result = evaluateProgram(input);
      expect(result).toBe(NULL);
    });

    test("non-empty array returns last element", () => {
      const input = "last([1, 2, 3])";
      const result = evaluateProgram(input);
      expect(result).toEqual(new Integer(3));
    });

    test("unsupported argument type", () => {
      const input = 'last("hello")';
      const result = evaluateProgram(input);
      expect(result).toBeInstanceOf(ArgumentNotSupportedError);
    });

    test("wrong number of arguments", () => {
      const input = 'last([1, 2], "two")';
      const result = evaluateProgram(input);
      expect(result).toEqual(new ArgumentWrongNumberError(1, 2));
    });
  });

  describe("rest", () => {
    test("empty array returns null", () => {
      const input = "rest([])";
      const result = evaluateProgram(input);
      expect(result).toBe(NULL);
    });

    test("non-empty array returns new copy without first element", () => {
      const input = "rest([1, 2, 3])";
      const result = evaluateProgram(input);
      expect(result).toEqual(new MArray([new Integer(2), new Integer(3)]));
    });

    test("unsupported argument type", () => {
      const input = 'rest("hello")';
      const result = evaluateProgram(input);
      expect(result).toBeInstanceOf(ArgumentNotSupportedError);
    });

    test("wrong number of arguments", () => {
      const input = 'rest([1, 2], "two")';
      const result = evaluateProgram(input);
      expect(result).toEqual(new ArgumentWrongNumberError(1, 2));
    });
  });

  describe("push", () => {
    test("new element is added at the end of array", () => {
      const input = "push([1, 2], 3)";
      const result = evaluateProgram(input);
      expect(result).toEqual(
        new MArray([new Integer(1), new Integer(2), new Integer(3)]),
      );
    });

    test("original array is not modified", () => {
      const input = "let a = [1, 2]; push(a, 3); a";
      const result = evaluateProgram(input);
      expect(result).toEqual(new MArray([new Integer(1), new Integer(2)]));
    });

    test("unsupported argument type", () => {
      const input = 'push("hello", 1)';
      const result = evaluateProgram(input);
      expect(result).toBeInstanceOf(ArgumentNotSupportedError);
    });

    test("wrong number of arguments", () => {
      const input = "push([1, 2], 3, 4)";
      const result = evaluateProgram(input);
      expect(result).toEqual(new ArgumentWrongNumberError(2, 3));
    });
  });
});
