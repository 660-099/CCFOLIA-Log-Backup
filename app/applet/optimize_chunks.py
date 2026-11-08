with open('src/utils/htmlGenerator.ts', 'r') as f:
    content = f.read()

# Replace start blocks
old_start = """  if (isStartExported && insertedBlocks && insertedBlocks['__start__']) {
    const startHtmlOffset = html.length;
    insertedBlocks['__start__'].forEach((block: any) => {
      if (block.type === 'image') {
        const url = typeof block === 'string' ? block : block.url;
        if (!url || (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('data:image/'))) return;
        
        const align = (typeof block === 'string' ? 'center' : block.align) || 'center';
        const justify = align === 'center' ? 'center' : align === 'right' ? 'flex-end' : 'flex-start';
        const width = typeof block === 'string' ? undefined : block.width;
        let widthStyle = 'max-width:100%;';
        if (width) {
          const widthStr = String(width);
          widthStyle = widthStr.endsWith('px') || widthStr.endsWith('%') ? `width:${widthStr};` : `width:${widthStr}px;`;
        }
        html += `<div class="c-e" style="${cleanStyle(`display:flex;justify-content:${justify};margin:10px ${s(15.6)}px`)}">
          <img src="${url}" style="${cleanStyle(`${widthStyle}border-radius:8px;display:block`)}" referrerPolicy="no-referrer" onerror="this.style.display='none'" />
        </div>`;
      } else if (block.type === 'bgm' && isValidBgm(block) && exportMode !== 'html') {
        const bgmTitle = block.title || '🎧 BGM';
        const parsed = parseYoutubeUrl(block.url, block.useTimestamp);
        const videoId = block.videoId || parsed.videoId || '';
        const startTime = block.startTime || parsed.startTime || 0;
        const safeTitle = bgmTitle.replace(/"/g, '&quot;');
        
        html += `<div style="${cleanStyle(`position:relative;margin-top:0px;margin-bottom:0px;`)}">
          <div class="c-i bgm-center-wrapper" style="display:flex;justify-content:center;align-items:center;width:100%;margin:12px 0;">
            <div class="custom-bgm" data-vid="${videoId}" data-start="${startTime}" data-title="${safeTitle}" onclick="triggerBGM(event, this)">
              <svg class="icon" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg> <span>${bgmTitle}</span>
            </div>
          </div>
        </div>`;
      }
    });
    if (html.length > startHtmlOffset) {
      renderedUnits.push({ html: html.slice(startHtmlOffset), logCount: 0 });
    }
  }"""

new_start = """  if (isStartExported && insertedBlocks && insertedBlocks['__start__']) {
    let startHtml = '';
    insertedBlocks['__start__'].forEach((block: any) => {
      if (block.type === 'image') {
        const url = typeof block === 'string' ? block : block.url;
        if (!url || (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('data:image/'))) return;
        
        const align = (typeof block === 'string' ? 'center' : block.align) || 'center';
        const justify = align === 'center' ? 'center' : align === 'right' ? 'flex-end' : 'flex-start';
        const width = typeof block === 'string' ? undefined : block.width;
        let widthStyle = 'max-width:100%;';
        if (width) {
          const widthStr = String(width);
          widthStyle = widthStr.endsWith('px') || widthStr.endsWith('%') ? `width:${widthStr};` : `width:${widthStr}px;`;
        }
        startHtml += `<div class="c-e" style="${cleanStyle(`display:flex;justify-content:${justify};margin:10px ${s(15.6)}px`)}">
          <img src="${url}" style="${cleanStyle(`${widthStyle}border-radius:8px;display:block`)}" referrerPolicy="no-referrer" onerror="this.style.display='none'" />
        </div>`;
      } else if (block.type === 'bgm' && isValidBgm(block) && exportMode !== 'html') {
        const bgmTitle = block.title || '🎧 BGM';
        const parsed = parseYoutubeUrl(block.url, block.useTimestamp);
        const videoId = block.videoId || parsed.videoId || '';
        const startTime = block.startTime || parsed.startTime || 0;
        const safeTitle = bgmTitle.replace(/"/g, '&quot;');
        
        startHtml += `<div style="${cleanStyle(`position:relative;margin-top:0px;margin-bottom:0px;`)}">
          <div class="c-i bgm-center-wrapper" style="display:flex;justify-content:center;align-items:center;width:100%;margin:12px 0;">
            <div class="custom-bgm" data-vid="${videoId}" data-start="${startTime}" data-title="${safeTitle}" onclick="triggerBGM(event, this)">
              <svg class="icon" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg> <span>${bgmTitle}</span>
            </div>
          </div>
        </div>`;
      }
    });
    if (startHtml.length > 0) {
      html += startHtml;
      renderedUnits.push({ html: startHtml, logCount: 0 });
    }
  }"""

if old_start in content:
    content = content.replace(old_start, new_start)
    print('Start blocks updated successfully')
else:
    print('old_start not found!')

# Find chunks.forEach section
start_marker = "  chunks.forEach((chunk, chunkIdx) => {\n    const chunkStartOffset = html.length;\n    const processChunk = () => {"
end_marker = "    };\n    processChunk();\n    const chunkHtmlSlice = html.slice(chunkStartOffset);\n    if (chunkHtmlSlice.length > 0) {\n      renderedUnits.push({ html: chunkHtmlSlice, logCount: chunk.logs.length });\n    }\n  });"

idx1 = content.find(start_marker)
idx2 = content.find(end_marker)

if idx1 != -1 and idx2 != -1:
    before = content[:idx1]
    inside = content[idx1 + len(start_marker):idx2]
    after = content[idx2 + len(end_marker):]
    
    # Replace html += with blockHtml += inside
    inside_new = inside.replace('html +=', 'blockHtml +=')
    
    new_start_chunk = "  chunks.forEach((chunk, chunkIdx) => {\n    let blockHtml = '';\n    const processChunk = () => {"
    new_end_chunk = "    };\n    processChunk();\n    html += blockHtml;\n    if (blockHtml.length > 0) {\n      renderedUnits.push({ html: blockHtml, logCount: chunk.logs.length });\n    }\n  });"
    
    content = before + new_start_chunk + inside_new + new_end_chunk + after
    print('chunks.forEach updated successfully! occurrences changed:', inside.count('html +='))
    with open('src/utils/htmlGenerator.ts', 'w') as f:
        f.write(content)
else:
    print('Markers not found! idx1:', idx1, 'idx2:', idx2)
