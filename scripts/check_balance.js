const fs = require('fs');
const path = 'client/src/app/docs/page.jsx';
const s = fs.readFileSync(path, 'utf8');
const pairs = {'{':'}','(':')','[':']'};
const stack = [];
for (let i = 0; i < s.length; i++) {
  const ch = s[i];
  if (ch === '"' || ch === "'" || ch === '`') {
    const q = ch; let j = i + 1; let closed = false;
    while (j < s.length) {
      if (s[j] === q && s[j-1] !== '\\') { closed = true; break; }
      j++;
    }
    if (!closed) { console.log('Unclosed string starting at index', i); process.exit(1); }
    i = j; // skip string
  } else if (ch === '{' || ch === '(' || ch === '[') {
    stack.push({c:ch, i});
  } else if (ch === '}' || ch === ')' || ch === ']') {
    if (stack.length === 0) { console.log('Unmatched closing', ch, 'at', i); process.exit(1); }
    const top = stack.pop();
    if (pairs[top.c] !== ch) { console.log('Mismatched', top.c, 'at', top.i, 'closed by', ch, 'at', i); process.exit(1); }
  }
}
if (stack.length) {
  const t = stack[stack.length-1];
  console.log('Unclosed', t.c, 'at', t.i);
  process.exit(1);
}
console.log('All balanced');
