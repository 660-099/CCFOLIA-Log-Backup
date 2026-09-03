const fs = require('fs');
let code = fs.readFileSync('src/utils/htmlGenerator.ts', 'utf-8');

const targetStr = `        if (activeTriggerBtn === btn) {
          if (ytPlayer && ytPlayer.seekTo) {
            ytPlayer.seekTo(currentStartSec, true);
            if (ytPlayer.getPlayerState && ytPlayer.getPlayerState() !== YT.PlayerState.PLAYING) ytPlayer.playVideo();
          }
          return;
        }`;

const replaceStr = `        if (activeTriggerBtn === btn) {
          togglePlayPause();
          return;
        }`;

code = code.replace(targetStr, replaceStr);
fs.writeFileSync('src/utils/htmlGenerator.ts', code);
