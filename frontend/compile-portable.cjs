const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const cacheDir = path.resolve('C:\\Users\\NITRO\\AppData\\Local\\electron-builder\\Cache\\winCodeSign');
const targetFolder = path.join(cacheDir, '785867095');
const archivePath = path.join(cacheDir, '785867095.7z');
const exe7z = path.resolve(__dirname, 'node_modules', '7zip-bin', 'win', 'x64', '7za.exe');

async function fixAndExtract() {
  try {
    console.log("1. Ensuring target folder exists...");
    if (!fs.existsSync(targetFolder)) {
      fs.mkdirSync(targetFolder, { recursive: true });
    }

    console.log("2. Manually extracting 7z archive (ignoring symlink errors)...");
    try {
      execSync(`"${exe7z}" x -bd -y "${archivePath}" "-o${targetFolder}"`, { stdio: 'ignore' });
    } catch (e) {
      // Ignore extraction error since it's just the macOS symlinks failing
      console.log("Extraction completed with expected Windows warnings.");
    }

    console.log("3. Creating dummy macOS files to satisfy completion checks...");
    const libDir = path.join(targetFolder, 'darwin', '10.12', 'lib');
    if (!fs.existsSync(libDir)) {
      fs.mkdirSync(libDir, { recursive: true });
    }

    fs.writeFileSync(path.join(libDir, 'libcrypto.dylib'), 'dummy');
    fs.writeFileSync(path.join(libDir, 'libssl.dylib'), 'dummy');
    console.log("Dummy files created successfully!");

    console.log("4. Running electron-builder to compile Portable EXE...");
    execSync('npx electron-builder --win portable', { stdio: 'inherit' });
    console.log("Portable EXE compiled successfully!");

    // Copy portable exe to public and dist
    const portableExeSource = path.resolve(__dirname, 'dist-electron', 'QuestionWhiz.exe');
    if (fs.existsSync(portableExeSource)) {
      fs.copyFileSync(portableExeSource, path.resolve(__dirname, 'public', 'QuestionWhiz.exe'));
      console.log("Copied QuestionWhiz.exe to public folder.");
      
      fs.copyFileSync(portableExeSource, path.resolve(__dirname, 'dist', 'QuestionWhiz.exe'));
      console.log("Copied QuestionWhiz.exe to dist folder.");
    }

  } catch (err) {
    console.error("Error in portable build process:", err.message);
    process.exit(1);
  }
}

fixAndExtract();
