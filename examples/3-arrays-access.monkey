let arrMixed = [1, "two", true, false, fn(x) { x }];

puts(arrMixed[0]);
puts(arrMixed[1]);

puts(arrMixed[1 + 1]);

let three = 1 + 2;
puts(arrMixed[three]);

puts(arrMixed[4](10));

puts(arrMixed[999999]);