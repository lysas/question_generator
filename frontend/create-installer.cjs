const winstaller = require('electron-winstaller');
const path = require('path');
const fs = require('fs');

async function build() {
  try {
    console.log("Generating native Windows Setup Installer (.exe). Please wait...");
    
    // Ensure the output installer directory exists
    const outputDir = path.resolve(__dirname, 'dist-electron', 'installer');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // This compiles the whole folder into a single QuestionWhizSetup.exe
    await winstaller.createWindowsInstaller({
      appDirectory: path.resolve(__dirname, 'dist-electron', 'QuestionWhiz-win32-x64'),
      outputDirectory: outputDir,
      authors: 'QuestionWhiz',
      exe: 'QuestionWhiz.exe',
      setupExe: 'QuestionWhizSetup.exe',
      noMsi: true, // We only need the single Setup.exe installer
    });
    
    console.log("Installer created successfully at dist-electron/installer/QuestionWhizSetup.exe!");

    // Copy setup installer to the public folder so it can be downloaded from the website
    const publicDest = path.resolve(__dirname, 'public', 'QuestionWhizSetup.exe');
    fs.copyFileSync(
      path.join(outputDir, 'QuestionWhizSetup.exe'),
      publicDest
    );
    console.log("Copied installer to public folder: " + publicDest);

    // Also copy to dist/ if it exists so the current build gets it immediately
    const distDest = path.resolve(__dirname, 'dist', 'QuestionWhizSetup.exe');
    if (fs.existsSync(path.resolve(__dirname, 'dist'))) {
      fs.copyFileSync(
        path.join(outputDir, 'QuestionWhizSetup.exe'),
        distDest
      );
      console.log("Copied installer to dist folder: " + distDest);
    }

  } catch (e) {
    console.error("Error generating installer: ", e.message);
    process.exit(1);
  }
}

build();
