const fs = require('fs');
const s = fs.readFileSync('src/controllers/knowledge.controller.js', 'utf8');
const counts = {
  opens: (s.match(/{/g) || []).length,
  closes: (s.match(/}/g) || []).length,
  paren_open: (s.match(/\(/g) || []).length,
  paren_close: (s.match(/\)/g) || []).length,
  sq_open: (s.match(/\[/g) || []).length,
  sq_close: (s.match(/\]/g) || []).length,
  single_quotes: (s.match(/'/g) || []).length,
  double_quotes: (s.match(/"/g) || []).length,
  backticks: (s.match(/`/g) || []).length,
};
console.log(counts);
