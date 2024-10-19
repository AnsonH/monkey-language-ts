let fibonacci = fn(n) {
  if (n < 1) {
    return 0;
  }
  if (n == 1) {
    return 1;
  }

  fibonacci(n - 1) + fibonacci(n - 2)
};

puts(fibonacci(10));