import { describe, expect, test } from "vitest";
import { evaluate } from "./evaluator.js";
import Lexer from "./lexer.js";
import { MBoolean, Integer, MObject } from "./object.js";
import Parser from "./parser.js";

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
  ];

  testCases.forEach(([input, expected]) => {
    test(`${input} should evaluate to ${expected}`, () => {
      const output = evaluateProgram(input);
      expect(output).toBeInstanceOf(MBoolean);
      expect((output as MBoolean).value).toBe(expected);
    });
  });
});
