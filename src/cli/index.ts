import { cac } from "cac";
import { startRepl } from "./repl.js";
import runFile from "./runFile.js";

const APP_NAME = "monkey-ts";

const cli = cac(APP_NAME);

cli
  .command(
    "[file]",
    "Path to a  `*.monkey` file. To run in REPL mode, omit this argument.",
  )
  .action((file?: string) => {
    if (file) {
      runFile(file);
    } else {
      startRepl();
    }
  });

cli.help();

cli.parse();
