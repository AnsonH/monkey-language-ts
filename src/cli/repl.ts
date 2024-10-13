import readline from "readline";
import { evaluate } from "../evaluator/evaluator.js";
import Lexer from "../lexer/lexer.js";
import Parser from "../parser/parser.js";
import Environment from "../evaluator/environment.js";

const PROMPT = ">> ";

const INTRO = `Welcome to the Monkey programming language REPL!`;

export function startRepl() {
  const env = new Environment();

  console.log(INTRO);
  process.stdout.write(PROMPT);

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  rl.on("line", (input) => {
    const lexer = new Lexer(input);
    const parser = new Parser(lexer);

    try {
      const program = parser.parseProgram();
      const evaluated = evaluate(program, env);
      console.log(evaluated.inspect());
    } catch (e) {
      console.error((e as Error).message);
    }

    process.stdout.write(PROMPT);
  });
}
