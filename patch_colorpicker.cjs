const fs = require('fs');
let code = fs.readFileSync('src/components/ColorPickerPopup.tsx', 'utf-8');

// Add onReset to props interface
code = code.replace(
  '  onChangeComplete?: (color: string) => void;\n}',
  '  onChangeComplete?: (color: string) => void;\n  onReset?: () => void;\n}'
);

// Add RotateCcw to imports
if (!code.includes('RotateCcw')) {
  code = code.replace(
    "import { ChevronsUpDown } from 'lucide-react';",
    "import { ChevronsUpDown, RotateCcw } from 'lucide-react';"
  );
}

// Add onReset to component arguments
code = code.replace(
  '  onChangeComplete\n}) => {',
  '  onChangeComplete,\n  onReset\n}) => {'
);

// Replace confirm button
const targetBtn = `<button \n          onClick={() => {\n            if (onChangeComplete) onChangeComplete(selectedColor);\n            else onChange(selectedColor);\n            onClose();\n          }}\n          className="w-full py-1.5 bg-[#e6005c] hover:bg-[#ff0066] text-white rounded-xl text-[11px] font-bold transition-all shadow-lg shadow-pink-500/20 active:scale-95"\n        >\n          확인\n        </button>`;

const newBtn = `<div className="flex gap-2">
          <button 
            onClick={() => {
              if (onChangeComplete) onChangeComplete(selectedColor);
              else onChange(selectedColor);
              onClose();
            }}
            className="flex-1 py-1.5 bg-[#e6005c] hover:bg-[#ff0066] text-white rounded-xl text-[11px] font-bold transition-all shadow-lg shadow-pink-500/20 active:scale-95"
          >
            확인
          </button>
          {onReset && (
            <button
              onClick={() => {
                onReset();
                onClose();
              }}
              className="w-8 h-8 shrink-0 flex items-center justify-center bg-white/5 hover:bg-white/10 text-white/50 hover:text-white rounded-xl transition-all"
              title="초기화"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>`;

code = code.replace(targetBtn, newBtn);

fs.writeFileSync('src/components/ColorPickerPopup.tsx', code);
