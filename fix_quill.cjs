const fs = require('fs');
let code = fs.readFileSync('src/components/LogItem.tsx', 'utf-8');

const target = `modules={quillModules}`;
const replace = `modules={quillModules}
                    formats={['bold', 'italic', 'underline', 'strike', 'color', 'background']}`;

code = code.replace(target, replace);
fs.writeFileSync('src/components/LogItem.tsx', code);
