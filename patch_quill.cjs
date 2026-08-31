const fs = require('fs');

let content = fs.readFileSync('src/components/LogItem.tsx', 'utf8');

// 1. Add imports
const imports = `// @ts-ignore
import ReactQuill, { Quill } from 'react-quill';
import 'react-quill/dist/quill.snow.css';

const ColorStyle = Quill.import('attributors/style/color');
const BackgroundStyle = Quill.import('attributors/style/background');
Quill.register(ColorStyle, true);
Quill.register(BackgroundStyle, true);

const quillModules = {
  toolbar: [
    ['bold', 'italic', 'underline', 'strike'],
    [{ 'color': [] }, { 'background': [] }],
    ['clean']
  ]
};
`;
content = content.replace("import { SearchableSelect } from './SearchableSelect';", "import { SearchableSelect } from './SearchableSelect';\n" + imports);

// 2. Remove states and functions
content = content.replace(/  const contentEditableRef = useRef<HTMLDivElement>\(null\);[\s\S]*?  const openColorPicker = \([\s\S]*?\};/m, '');

// 3. Replace editor block
const oldEditorBlockRegex = /\{\/\* Rich Text Toolbar \*\/\}([\s\S]*?)<\/div>\s*\}\)\s*\}?\s*<\/div>\s*<\/div>\s*\)\s*:\s*log\.isCommand/m;
const match = content.match(/\{\/\* Rich Text Toolbar \*\/\}([\s\S]*?)<\/div>\s*\)\s*:\s*log\.isCommand/m);

if (match) {
  const replacement = `
                {/* React Quill Editor */}
                <div className="quill-editor-container" style={{ minHeight: '64px' }}>
                  <ReactQuill 
                    value={editContent}
                    onChange={setEditContent}
                    modules={quillModules}
                    theme="snow"
                    className={cn(
                      "w-full text-[13px] rounded outline-none",
                      theme === 'dark' ? "bg-black/35 text-white quill-dark" : "bg-white text-stone-800"
                    )}
                  />
                </div>
              </div>
            </div>
          ) : log.isCommand`;
  content = content.replace(match[0], replacement);
  fs.writeFileSync('src/components/LogItem.tsx', content);
  console.log("Patch successful!");
} else {
  console.log("Could not find the editor block to replace.");
}
