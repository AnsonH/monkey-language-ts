let mixedHash = {
  "one": 1,
  2: "two",
  true: 3,
  false: fn(x) { x },
  "hello world": "monkey rocks!",
};

puts(mixedHash["one"]);
puts(mixedHash[2]);
puts(mixedHash[true]);
puts(mixedHash[false](4));

let key = "hello" + " " + "world";
puts(mixedHash[key]);

puts(mixedHash["non-existent key"]);