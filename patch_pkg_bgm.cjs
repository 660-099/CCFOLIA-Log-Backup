const fs = require('fs');
const path = './package.json';
let content = fs.readFileSync(path, 'utf8');

content = content.replace('"version": "1.10.13"', '"version": "1.10.14"');

fs.writeFileSync(path, content);
console.log('package.json updated');
