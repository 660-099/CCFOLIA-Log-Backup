import re

with open('src/App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Extract '얼굴 위주 크롭' block
crop_block_pattern = r'(\s*<div className="flex items-center justify-between p-3 bg-white/5 border border-white/5 rounded-xl shadow-sm h-11 relative">\s*<span className="text-\[11px\] font-bold text-white/70">얼굴 위주 크롭 \(상단 1:1\)</span>\s*<Toggle\s*enabled={cropFaceTop}\s*onChange={\(val\) => {\s*setCropFaceTop\(val\);\s*saveToHistory\({ cropFaceTop: val }\);\s*}\}\s*/>\s*</div>)'

# Extract '스탠딩 숨김' block
hide_block_pattern = r'(\s*<div className="flex items-center justify-between p-3 bg-white/5 border border-white/5 rounded-xl shadow-sm h-11 relative">\s*<span className="text-\[11px\] font-bold text-white/70">스탠딩 숨김</span>\s*<Toggle\s*enabled={hideAllAvatars}\s*onChange={\(val\) => {\s*setHideAllAvatars\(val\);\s*saveToHistory\({ hideAllAvatars: val }\);\s*}\}\s*/>\s*</div>)'

crop_block = re.search(crop_block_pattern, content)
hide_block = re.search(hide_block_pattern, content)

if crop_block and hide_block:
    # Remove from original location
    content = content.replace(crop_block.group(1), '')
    content = content.replace(hide_block.group(1), '')
    
    # Locate narration character block end
    # We look for:
    # </div>
    # </div>
    # {narrationCharacter && (
    target_pattern = r'(</div>\s*</div>\s*\{narrationCharacter && \()'
    
    # We want to insert hide_block then crop_block right before {narrationCharacter && (
    replacement = hide_block.group(1) + crop_block.group(1) + r'\n                    {narrationCharacter && ('
    
    # Just in case, let's find the exact place.
    # The block ends with:
    #                                   </button>
    #                                 );
    #                               })}
    #                             </div>
    #                           </div>
    #                         )}
    #                       </div>
    #                     </div>
    #                     {narrationCharacter && (
    
    content = content.replace('</div>\n                    </div>\n                    {narrationCharacter && (', '</div>\n                    </div>' + hide_block.group(1) + crop_block.group(1) + '\n                    {narrationCharacter && (')
    
    with open('src/App.tsx', 'w', encoding='utf-8') as f:
        f.write(content)
    print("Success")
else:
    print("Failed to find blocks")
