const fs = require('fs');
let app = fs.readFileSync('src/App.tsx', 'utf-8');
app = app.replace(
  '<Info className="w-3.5 h-3.5" /> 데모 로그 보기',
  '<Info className="w-3.5 h-3.5" /> 데모 로그 보기 (간단 설명서)'
);
fs.writeFileSync('src/App.tsx', app);
