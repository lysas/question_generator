$desktop = [Environment]::GetFolderPath('Desktop')
$installerUrl = "https://yourdomain.com/QuestionWhizSetup.exe"
$destPath = Join-Path $desktop "QuestionWhizSetup.exe"
Write-Host "Downloading QuestionWhiz installer..."
Invoke-WebRequest -Uri $installerUrl -OutFile $destPath -UseBasicParsing
Write-Host "Download complete. Launching installer..."
Start-Process $destPath
