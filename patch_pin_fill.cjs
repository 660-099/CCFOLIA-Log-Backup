const fs = require('fs');
let code = fs.readFileSync('src/components/CharImagePanelPopup.tsx', 'utf-8');

const oldPin = '<Pin className="w-3.5 h-3.5" />';
const newPin = '<Pin className={cn("w-3.5 h-3.5", isPinned && "fill-current")} />';

if (code.includes(oldPin)) {
  code = code.replace(oldPin, newPin);
  fs.writeFileSync('src/components/CharImagePanelPopup.tsx', code);
  console.log("Successfully replaced pin icon to support fill.");
} else {
  console.log("Could not find the target Pin element.");
}
