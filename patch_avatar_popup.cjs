const fs = require('fs');
let code = fs.readFileSync('src/components/AvatarImagePopup.tsx', 'utf-8');

const updatedUseEffect = `  const selectedImgIdRef = useRef<string | null>(null);

  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (panelRef.current && !panelRef.current.contains(target)) {
        if (triggerRect) {
          const triggerBox = new DOMRect(triggerRect.x, triggerRect.y, triggerRect.width, triggerRect.height);
          if (
            e.clientX >= triggerBox.left &&
            e.clientX <= triggerBox.right &&
            e.clientY >= triggerBox.top &&
            e.clientY <= triggerBox.bottom
          ) {
            return;
          }
        }
        
        if (selectedImgIdRef.current) {
          onSelectSingle(selectedImgIdRef.current);
        } else {
          onClose();
        }
      }
    };
    
    setTimeout(() => {
      document.addEventListener('mousedown', handleGlobalClick);
    }, 10);
    return () => {
      document.removeEventListener('mousedown', handleGlobalClick);
    };
  }, [onClose, triggerRect, onSelectSingle]);`;

const oldUseEffectRegex = /useEffect\(\(\) => \{[\s\S]*?\}, \[onClose, triggerRect, selectedImgId, onSelectSingle\]\);/;
code = code.replace(oldUseEffectRegex, updatedUseEffect);
code = code.replace("import React, { useEffect, useRef, useState } from 'react';", "import React, { useEffect, useRef, useState } from 'react';");

const updatedOnClick = `onClick={(e) => {
                      e.stopPropagation();
                      if (selectedImgId === img.id) {
                        onSelectSingle(img.id);
                      } else {
                        setSelectedImgId(img.id);
                        selectedImgIdRef.current = img.id;
                      }
                    }}`;
const oldOnClickRegex = /onClick=\{\(e\) => \{[\s\S]*?setSelectedImgId\(img\.id\);\s*\}\s*\}\}/;
code = code.replace(oldOnClickRegex, updatedOnClick);

fs.writeFileSync('src/components/AvatarImagePopup.tsx', code);
