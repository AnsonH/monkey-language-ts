import readline from "readline";
import Lexer from "./lexer.js";
import { TokenType } from "./token.js";

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

    while (true) {
      const token = lexer.getNextToken();
      console.log(token);
      if (token.type === TokenType.Eof) {
        break;
      }
    }

    process.stdout.write(PROMPT);
  });
}
