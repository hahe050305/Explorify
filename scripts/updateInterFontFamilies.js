const fs = require('fs');
const path = require('path');

const srcDir = path.resolve('C:/Projects/Explorify/src');

function getFamilyForWeight(weight) {
  switch (weight) {
    case '500':
      return 'Inter-Medium';
    case '600':
      return 'Inter-SemiBold';
    case '700':
    case 'bold':
      return 'Inter-Bold';
    case '800':
      return 'Inter-ExtraBold';
    case '900':
      return 'Inter-Black';
    case '400':
    case 'normal':
    default:
      return 'Inter-Regular';
  }
}

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  // Regex to match:
  // fontWeight: '800',
  // fontFamily: 'Inter',
  // or fontFamily: 'Inter' followed or preceded by fontWeight
  
  // 1. Replace pattern: fontWeight: 'xxx', \n  fontFamily: 'Inter' (or any Inter variant)
  let updated = content.replace(
    /fontWeight\s*:\s*['"]([^'"]+)['"]\s*,\s*(?:\r?\n\s*)?fontFamily\s*:\s*['"]Inter[^'"]*['"]/g,
    (match, weight) => {
      const family = getFamilyForWeight(weight);
      return `fontWeight: '${weight}',\n    fontFamily: '${family}'`;
    }
  );

  // 2. Replace pattern: fontFamily: 'Inter'..., \n  fontWeight: 'xxx'
  updated = updated.replace(
    /fontFamily\s*:\s*['"]Inter[^'"]*['"]\s*,\s*(?:\r?\n\s*)?fontWeight\s*:\s*['"]([^'"]+)['"]/g,
    (match, weight) => {
      const family = getFamilyForWeight(weight);
      return `fontFamily: '${family}',\n    fontWeight: '${weight}'`;
    }
  );

  // 3. Any standalone fontFamily: 'Inter' without specific weight -> 'Inter-Regular'
  updated = updated.replace(/fontFamily\s*:\s*['"]Inter['"]/g, "fontFamily: 'Inter-Regular'");

  // 4. Also clean up commented-out //fontFamily: 'Inter',
  updated = updated.replace(/\s*\/\/fontFamily:\s*['"]Inter['"],?/g, '');

  if (updated !== content) {
    fs.writeFileSync(filePath, updated, 'utf8');
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
console.log('Finished updating font families!');
