const fs = require('fs');
const s = fs.readFileSync('src/controllers/knowledge.controller.js','utf8');
const lines = s.split('\n');
let bal = 0; let maxBal = 0; let maxLine = 0;
for(let i=0;i<lines.length;i++){
  const line = lines[i];
  for(const ch of line){ if(ch==='{' ) bal++; if(ch==='}') bal--; }
  if(bal>maxBal){ maxBal=bal; maxLine=i+1 }
}
console.log('finalBal',bal,'maxBal',maxBal,'maxLine',maxLine,'totalLines',lines.length);
// print context around maxLine
const start = Math.max(0,maxLine-5); const end = Math.min(lines.length, maxLine+5);
console.log('\nContext around max balance:');
for(let i=start;i<end;i++) console.log((i+1).toString().padStart(4)+':',lines[i]);
