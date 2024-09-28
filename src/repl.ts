import readline from "readline";
import Lexer from "./lexer.js";
import Parser from "./parser.js";
import print from "./printer.js";

const PROMPT = ">> ";

const INTRO = `Welcome to the Monkey programming language REPL!`;

export function startRepl() {
  console.log(INTRO);
  process.stdout.write(PROMPT);

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  rl.on("line", (input) => {
    const lexer = new Lexer(input);
    const parser = new Parser(lexer);

    const program = parser.parseProgram();
    if (parser.getErrors().length > 0) {
      parser.getErrors().forEach((error) => console.log(error.message));
      return;
    }

    console.log(print(program));

    process.stdout.write(PROMPT);
  });
}
