const fs = require('fs');
let app = fs.readFileSync('src/App.tsx', 'utf-8');

// replace all imports of CharImagePanelPopup
app = app.replace(/import \{ CharImagePanelPopup \} from '.\/components\/CharImagePanelPopup';\n/g, "");
app = app.replace(/import \{ CharImagePanelPopup \} from ".\/components\/CharImagePanelPopup";\n/g, "");

// add it once at the correct place
app = app.replace(
  "import { LogItem } from './components/LogItem';",
  "import { LogItem } from './components/LogItem';\nimport { CharImagePanelPopup } from './components/CharImagePanelPopup';"
);

fs.writeFileSync('src/App.tsx', app);
