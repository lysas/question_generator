const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const sourceDir = path.resolve(__dirname, 'dist-electron', 'QuestionWhiz-win32-x64');
const outputZip = path.resolve(__dirname, 'public', 'QuestionWhiz-Windows.zip');

// Remove old zip if exists
if (fs.existsSync(outputZip)) {
  fs.unlinkSync(outputZip);
  console.log('Removed old zip file.');
}

console.log('Creating zip archive from:', sourceDir);
console.log('Output:', outputZip);

// Use Windows native tar (available on Win10+) — fast and reliable
try {
  execSync(
    `tar -a -cf "${outputZip}" -C "${sourceDir}" .`,
    { stdio: 'inherit' }
  );
  console.log('\\nZip archive created successfully!');
  console.log('Size:', (fs.statSync(outputZip).size / 1024 / 1024).toFixed(1), 'MB');
} catch (err) {
  console.error('Failed to create zip:', err.message);
  process.exit(1);
}
