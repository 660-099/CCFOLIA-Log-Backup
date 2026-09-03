const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');
code = code.replace('s,,', '  Users,\n  User,');
code = code.replace(',\n} from \'lucide-react\'', '\n} from \'lucide-react\'');
fs.writeFileSync('src/App.tsx', code);
