# Monkey Language Examples

## How to Run?

At the root of the project:

```bash
pnpm build
node ./lib/cli/index.js ./examples/1-hello-world.monkey
```

## Examples

| Example                                                        | Description                                                                          |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| [1-hello-world.monkey](./1-hello-world.monkey)                 | Prints "Hello World!" to console.                                                    |
| [2-functions.monkey](./2-functions.monkey)                     | Functions are first-class citizens. It supports higher-order functions and closures. |
| [3-arrays-access.monkey](./3-arrays-access.monkey)             | Accessing elements in an array.                                                      |
| [4-arrays-builtins.monkey](./4-arrays-builtins.monkey)         | Array built-in functions.                                                            |
| [5-arrays-map-reduce.monkey](./5-arrays-map-reduce.monkey)     | Array map and reduce functions.                                                      |
| [6-hashes.monkey](./6-hashes.monkey)                           | Hash maps.                                                                           |
| [7-fibonacci.monkey](./7-fibonacci.monkey)                     | Calculate Fibonacci number using recursion.                                          |
| [8-fibonacci-sequences.monkey](./8-fibonacci-sequences.monkey) | Calculate Fibonacci number sequences with dynamic programming.                       |
