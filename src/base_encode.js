// Base62
const ALPHA_NUM = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
// Base58
// const ALPHA_NUM = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

function base62Encode(n, cypher = ALPHA_NUM) {
  if (n == 0n)
    return cypher[n];

  // R is remainder
  let encode = '';
  let base = BigInt(cypher.length);
  let R = BigInt(0);

  while (n) {
    R = n % base;
    n = n / base;
    encode = cypher[R] + encode;
  }
  
  console.log(encode);
  return encode;
}

module.exports.base62Encode = base62Encode;