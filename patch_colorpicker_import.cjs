const fs = require('fs');
let code = fs.readFileSync('src/components/ColorPickerPopup.tsx', 'utf-8');

if (!code.includes('RotateCcw')) {
  code = code.replace(
    "import { Check, Edit2, Pencil, ChevronsUpDown } from 'lucide-react';",
    "import { Check, Edit2, Pencil, ChevronsUpDown, RotateCcw } from 'lucide-react';"
  );
  fs.writeFileSync('src/components/ColorPickerPopup.tsx', code);
}
