const fs = require('fs');
const path = './src/components/LogItem.tsx';
let content = fs.readFileSync(path, 'utf8');

const target = `    return (
      <div 
        className={cn("log-item-wrapper relative group/item w-full min-h-[30px] flex flex-col justify-center", isHighlighted ? 'bg-[#ffd400]/20' : '')}
        style={{
          marginTop: \`\${Math.floor(effectiveBlockSpacing / 2)}px\`,
          marginBottom: \`\${Math.ceil(effectiveBlockSpacing / 2)}px\`
        }}
      >
        {isCurrentMatch && (`;

const newCode = `    return (
      <div 
        className={cn(
          "log-item-wrapper relative group/item w-full min-h-[30px] flex flex-col justify-center", 
          isHighlighted && "bg-[#ffd400]/20",
          dragOverPart === 'top' && "is-drag-over-top",
          dragOverPart === 'bottom' && "is-drag-over-bottom"
        )}
        style={{
          marginTop: \`\${Math.floor(effectiveBlockSpacing / 2)}px\`,
          marginBottom: \`\${Math.ceil(effectiveBlockSpacing / 2)}px\`
        }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {dragOverPart === 'top' && (
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-[#e6005c] z-50 pointer-events-none" />
        )}
        {dragOverPart === 'bottom' && (
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#e6005c] z-50 pointer-events-none" />
        )}
        {isCurrentMatch && (`;

if (content.includes(target)) {
  content = content.replace(target, newCode);
  fs.writeFileSync(path, content);
  console.log('Fixed bgm block drag drop');
} else {
  console.log('Target not found in LogItem.tsx');
}
