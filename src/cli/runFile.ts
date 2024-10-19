import fs from "fs";
import Environment from "../evaluator/environment.js";
import { evaluate } from "../evaluator/evaluator.js";
import Lexer from "../lexer/lexer.js";
import Parser from "../parser/parser.js";

/**
 * Reads and evaluates a Monkey file.
 *
 * @param filePath A path to a Monkey file (`*.monkey`).
 */
function runFile(filePath: string) {
  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    return;
  }
  if (!filePath.endsWith(".monkey")) {
    console.error("File must have a `.monkey` extension");
    return;
  }

  try {
    // NOTE: Monkey lexer only supports ASCII
    const content = fs.readFileSync(filePath, "ascii");

    const env = new Environment();
    const lexer = new Lexer(content);
    const parser = new Parser(lexer);

    const program = parser.parseProgram();
    evaluate(program, env);
  } catch (e) {
    console.error((e as Error).message);
  }
}

export default runFile;
