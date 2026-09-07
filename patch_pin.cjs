const fs = require('fs');
let code = fs.readFileSync('src/components/CharImagePanelPopup.tsx', 'utf-8');

const oldStr = 'isPinned ? "bg-[#e6005c] text-white" : "text-white/40 hover:bg-white/10 hover:text-white"';
const newStr = 'isPinned ? "text-[#e6005c] hover:bg-[#e6005c]/10" : "text-white/40 hover:bg-white/10 hover:text-white"';

if (code.includes(oldStr)) {
  code = code.replace(oldStr, newStr);
  fs.writeFileSync('src/components/CharImagePanelPopup.tsx', code);
  console.log("Successfully replaced pin button styles.");
} else {
  console.log("Could not find the target string.");
}
