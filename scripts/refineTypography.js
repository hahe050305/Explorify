const fs = require('fs');
const path = require('path');

const srcDir = path.resolve('C:/Projects/Explorify/src');

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let updated = content;

  // 1️⃣ Downgrade heavy weight 800 (Inter-ExtraBold) to 600 (Inter-SemiBold) for most UI text.
  // Keep 800 for price / title if the style name includes 'price' or 'title'.
  updated = updated.replace(/fontWeight\s*:\s*['"]800['"]\s*,/g, (match) => {
    // Look back a few characters to guess the style name (simple heuristic: preceding comment or variable name)
    // We'll conservatively replace all 800 with 600 – premium headings will still be clear via size.
    return "fontWeight: '600',";
  });

  // 2️⃣ Remove all uppercase transforms – we want natural case for a modern look.
  updated = updated.replace(/textTransform\s*:\s*['"]uppercase['"]\s*,?\s*\n?/gi, '');

  // 3️⃣ Optionally replace secondary text color usage with subtext color where fontWeight <= 600 and size <= 14.
  // We'll perform a simple pattern: if a line contains fontSize <= 14 and fontWeight: '600' or lower, replace COLORS.text with COLORS.subtext.
  // This is a heuristic; real refactor would need AST.
  updated = updated.replace(/(fontSize\s*:\s*\d{1,2}),\s*\n\s*color\s*:\s*COLORS\.text/g, (match, size) => {
    const sz = parseInt(size.replace('fontSize:', '').trim());
    if (sz <= 14) {
      return `${size},\n    color: COLORS.subtext`;
    }
    return match;
  });

  if (updated !== content) {
    fs.writeFileSync(filePath, updated, 'utf8');
    console.log(`Refined typography in ${filePath}`);
  }
}

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
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
console.log('Typography refinement completed.');
