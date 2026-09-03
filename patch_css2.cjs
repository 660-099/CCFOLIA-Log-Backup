const fs = require('fs');
let css = fs.readFileSync('src/index.css', 'utf-8');
css = css.replace(
  '  transition: all 0.2s ease;\n  max-width: 90%;\n}',
  '  transition: all 0.2s ease;\n  max-width: 80%;\n}'
);
css = css.replace(
  '  line-height: 1.4;\n  max-width: 250px;\n}',
  '  line-height: 1.4;\n}'
);
fs.writeFileSync('src/index.css', css);
