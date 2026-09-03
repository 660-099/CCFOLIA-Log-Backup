const fs = require('fs');
const path = './package.json';
let content = fs.readFileSync(path, 'utf8');

content = content.replace('"version": "1.10.10"', '"version": "1.10.12"');
content = content.replace('"version": "1.10.11"', '"version": "1.10.12"'); // just in case

fs.writeFileSync(path, content);
console.log('package.json updated');
