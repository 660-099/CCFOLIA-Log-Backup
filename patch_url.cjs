const fs = require('fs');
let utils = fs.readFileSync('src/utils.ts', 'utf-8');

utils = utils.replace(
  'const urlPattern = /(https?:\\/\\/[^\\s<]+)/g;',
  'const urlPattern = /(https?:\\/\\/[^\\s<]*[^\\s<.,!?:;"\'])/g;'
);
fs.writeFileSync('src/utils.ts', utils);

let logItem = fs.readFileSync('src/components/LogItem.tsx', 'utf-8');
logItem = logItem.replace(
  'const safeHtmlName = useMemo(() => DOMPurify.sanitize(displayName), [displayName]);',
  'const safeHtmlName = useMemo(() => DOMPurify.sanitize(displayName, { ADD_ATTR: [\'style\'] }), [displayName]);'
);
fs.writeFileSync('src/components/LogItem.tsx', logItem);
