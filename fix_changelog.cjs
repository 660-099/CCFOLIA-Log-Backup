const fs = require('fs');

let content = fs.readFileSync('CHANGELOG.md', 'utf-8');

// Find the misplaced v1.10.17 at the bottom
const bottomMatch = content.match(/## v1\.10\.17 \(2026-09-07\)[\s\S]*?(?=(?:## \[|## v\d+|$))/);

if (bottomMatch) {
    const v17Block = bottomMatch[0].trim();
    
    // Remove it from the bottom
    content = content.replace(bottomMatch[0], "");
    
    // Insert it at the top, just below # Changelog
    const titleMatch = content.match(/# Changelog\n+/);
    if (titleMatch) {
        // Fix the header format to match the others (brackets)
        const fixedV17Block = v17Block.replace("## v1.10.17", "## [1.10.17]");
        
        content = content.replace(
            titleMatch[0], 
            `# Changelog\n\n${fixedV17Block}\n\n`
        );
        
        fs.writeFileSync('CHANGELOG.md', content);
        console.log("CHANGELOG.md successfully reorganized!");
    } else {
        console.log("Could not find '# Changelog' header.");
    }
} else {
    console.log("Could not find v1.10.17 block at the bottom.");
}
