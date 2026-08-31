const fs = require('fs');
const path = './src/App.tsx';
let content = fs.readFileSync(path, 'utf8');

const target = `                              width: '100%',
                              transform: \`translateY(\${Math.round(virtualItem.start)}px)\`,
                            }}
                          >
                            <LogItem`;

const newCode = `                              width: '100%',
                              transform: \`translateY(\${Math.round(virtualItem.start)}px)\`,
                              transition: isMovingBlock ? 'transform 0.2s ease-in-out' : 'none',
                            }}
                          >
                            <LogItem`;

if (content.includes(target)) {
  content = content.replace(target, newCode);
  fs.writeFileSync(path, content);
  console.log('Fixed transition');
} else {
  console.log('Target not found in transition');
}
