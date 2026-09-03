const fs = require('fs');
let code = fs.readFileSync('src/components/ColorPickerPopup.tsx', 'utf-8');

code = code.replace(
  'export const ColorPickerPopup = ({ color, extractedColors, triggerRect, onClose, onChange, onChangeComplete }: ColorPickerPopupProps) => {',
  'export const ColorPickerPopup = ({ color, extractedColors, triggerRect, onClose, onChange, onChangeComplete, onReset }: ColorPickerPopupProps) => {'
);

fs.writeFileSync('src/components/ColorPickerPopup.tsx', code);
