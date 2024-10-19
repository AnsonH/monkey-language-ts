let add = fn(x, y) { 
  return x + y;
};
puts(add(1, 2));


let abs = fn(x) {
  if (x < 0) { -x } else { x }
}
puts(abs(-5));


let createAdder = fn(x) {
  fn(y) { x + y }
};
let addTen = createAdder(10);
puts(addTen(5));


let immediatelyInvoked = fn(x) { x + 20 }(5);
puts(immediatelyInvoked);