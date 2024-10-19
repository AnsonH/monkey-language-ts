let fibonacci_sequence = fn(n) {
  if (n < 1) { 
    return [0];
  }
  if (n == 1) { 
    return [0, 1];
  }
  
  let iter = fn(x, acc) {
    let acc_updated = push(acc, acc[x - 1] + acc[x - 2]);
    if (x == n) {
      return acc_updated;
    }
    return iter(x + 1, acc_updated);
  };
  
  iter(2, [0, 1])
};

let fibonacci = fn(n) {
  last(fibonacci_sequence(n))
};

let n = 10;
puts(fibonacci_sequence(n));
puts(fibonacci(n));