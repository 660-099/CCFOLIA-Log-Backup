const fs = require('fs');
const path = './src/App.tsx';
let content = fs.readFileSync(path, 'utf8');
content = content.replace("  Archive\n} from 'lucide-react';", "  Archive,\n  User\n} from 'lucide-react';");
fs.writeFileSync(path, content);
console.log('import patched');
