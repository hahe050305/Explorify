const fs = require('fs');
const path = require('path');

const srcDir = path.resolve('C:/Projects/Explorify/src');

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  // Regex to find style objects with fontWeight and add fontFamily: 'Inter'
  const regex = /(fontWeight\s*:\s*'[^']*')(\s*,?)/g;
  const newContent = content.replace(regex, (match, p1, p2) => {
    // Check if fontFamily already present in same object line before closing brace
    // Simple: add after fontWeight if not already present soon after
    return `${p1},\n    fontFamily: 'Inter'${p2}`;
  });
  if (newContent !== content) {
    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log(`Updated ${filePath}`);
  }
}

function walk(dir) {
  const entries = fs.readdirSync(dir, {withFileTypes: true});
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath);
    } else if (entry.isFile() && fullPath.endsWith('.tsx')) {
      processFile(fullPath);
    }
  }
}

walk(srcDir);
