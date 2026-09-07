const fs = require('fs');
let code = fs.readFileSync('src/components/CharImagePanelPopup.tsx', 'utf-8');

code = code.replace(
  "  isPinned: boolean;",
  "  isPinned: boolean;\n  onMouseEnter?: () => void;\n  onMouseLeave?: () => void;\n  onThumbnailHover?: (url: string | null, rect: DOMRect | null) => void;"
);

code = code.replace(
  "  color\n}) => {",
  "  color,\n  onMouseEnter,\n  onMouseLeave,\n  onThumbnailHover\n}) => {"
);

code = code.replace(
  "      onMouseLeave={() => {\n        if (!isPinned) onClose();\n      }}",
  "      onMouseEnter={onMouseEnter}\n      onMouseLeave={() => {\n        if (onMouseLeave) onMouseLeave();\n        if (!isPinned) onClose();\n      }}"
);

const oldButtonStr = `                <button
                  onClick={() => {
                    if (!isNew && !item.isRepresentative) {
                      onSetRepresentative(item.id);
                    }
                  }}
                  className={cn(
                    "w-6 h-6 shrink-0 rounded flex items-center justify-center transition-colors",
                    item.isRepresentative
                      ? "bg-[#e6005c] text-white"
                      : isNew
                        ? "bg-white/5 text-white/30 cursor-default"
                        : "bg-white/5 text-white/30 hover:bg-white/10 hover:text-white"
                  )}
                  disabled={isNew}
                  title={isNew ? "" : item.isRepresentative ? "대표 이미지" : "대표 이미지로 설정"}
                >
                  {item.isRepresentative ? <Check className="w-3.5 h-3.5" /> : <ImageIcon className="w-3.5 h-3.5" />}
                </button>`;

const newButtonStr = `                <button
                  onClick={() => {
                    if (!isNew && !item.isRepresentative) {
                      onSetRepresentative(item.id);
                    }
                  }}
                  onMouseEnter={(e) => {
                    if (!isNew && onThumbnailHover) {
                      onThumbnailHover(item.url, e.currentTarget.getBoundingClientRect());
                    }
                  }}
                  onMouseLeave={() => {
                    if (!isNew && onThumbnailHover) {
                      onThumbnailHover(null, null);
                    }
                  }}
                  className={cn(
                    "w-6 h-6 shrink-0 rounded overflow-hidden flex items-center justify-center transition-all",
                    item.isRepresentative
                      ? "ring-1 ring-[#e6005c] ring-offset-1 ring-offset-[#222]"
                      : isNew
                        ? "bg-white/5 text-white/30 cursor-default"
                        : "bg-white/5 text-white/30 hover:bg-white/10 hover:text-white"
                  )}
                  disabled={isNew}
                  title={isNew ? "" : item.isRepresentative ? "대표 이미지" : "대표 이미지로 설정"}
                >
                  {isNew ? (
                    <ImageIcon className="w-3.5 h-3.5" />
                  ) : (
                    <img src={item.url} alt="" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                  )}
                </button>`;

code = code.replace(oldButtonStr, newButtonStr);

fs.writeFileSync('src/components/CharImagePanelPopup.tsx', code);
