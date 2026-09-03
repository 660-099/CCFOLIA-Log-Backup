const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

const target = `onSelectBgmTrack={(track) => setCurrentBgmTrack(track)}`;
const replace = `onSelectBgmTrack={(track) => {
                                if (currentBgmTrack?.id === track.id) {
                                  window.dispatchEvent(new CustomEvent('bgm-toggle-play', { detail: { id: track.id } }));
                                } else {
                                  setCurrentBgmTrack(track);
                                }
                              }}`;
code = code.replace(target, replace);
fs.writeFileSync('src/App.tsx', code);
