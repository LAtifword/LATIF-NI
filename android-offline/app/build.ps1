$ErrorActionPreference = 'Stop'
$Project = $PSScriptRoot
$Source = Join-Path (Split-Path $Project -Parent) 'latif-qwen2.5-0.5b-q4_k_m.gguf'
$Target = Join-Path $Project 'assets\models\latif-qwen2.5-0.5b-q4_k_m.gguf'
$SDK = Join-Path $env:LOCALAPPDATA 'Android\Sdk'
$PNPM = Join-Path ((npm.cmd prefix -g).Trim()) 'pnpm.cmd'
if (!(Test-Path $Source)) { throw "Missing original model: $Source" }
if (!(Test-Path $SDK)) { throw "Missing Android SDK: $SDK" }
if (!(Test-Path $PNPM)) { throw "Missing pnpm executable: $PNPM" }
$env:ANDROID_HOME=$SDK
$env:ANDROID_SDK_ROOT=$SDK
$env:JAVA_HOME='C:\Program Files\Eclipse Adoptium\jdk-17.0.20.101-hotspot'
if (!(Test-Path $env:JAVA_HOME)) { $env:JAVA_HOME=(Split-Path (Split-Path (Get-Command javac.exe).Source -Parent) -Parent) }
$env:Path="$env:JAVA_HOME\bin;$SDK\platform-tools;$env:Path"
Set-Location $Project
if (!(Test-Path $Target)) {
  Copy-Item -LiteralPath $Source -Destination $Target
}
$expected='4C5DEEC6759705C82C4EC59E8611383ED1C5FD1BADAE6FBD104FBEC891480A76'
$actual=(Get-FileHash -LiteralPath $Target -Algorithm SHA256).Hash
if ($actual -ne $expected) { throw "Model hash mismatch. Expected $expected, found $actual" }
Write-Host "GGUF SHA-256 verified" -ForegroundColor Green
& $PNPM install
if ($LASTEXITCODE -ne 0) { throw 'pnpm install failed' }
& $PNPM run model:verify
if ($LASTEXITCODE -ne 0) { throw 'GGUF check failed' }
& $PNPM exec tsc --noEmit
if ($LASTEXITCODE -ne 0) { throw 'TypeScript check failed' }
& $PNPM exec expo prebuild --platform android
if ($LASTEXITCODE -ne 0) { throw 'Expo prebuild failed' }
$Android=Join-Path $Project 'android'
Set-Content (Join-Path $Android 'local.properties') ("sdk.dir="+$SDK.Replace('\','/')) -Encoding ASCII
Push-Location $Android
try {
  & '.\gradlew.bat' assembleRelease --no-daemon --stacktrace
  if ($LASTEXITCODE -ne 0) { throw 'Gradle release build failed' }
} finally { Pop-Location }
$Apk=Join-Path $Android 'app\build\outputs\apk\release\app-release.apk'
if (!(Test-Path $Apk)) { throw "APK not found: $Apk" }
$Output=Join-Path $Project 'dist'
New-Item $Output -ItemType Directory -Force | Out-Null
Copy-Item $Apk (Join-Path $Output 'LATIF-OFFLINE-AI.apk') -Force
Write-Host "APK built at $Output\LATIF-OFFLINE-AI.apk" -ForegroundColor Green
Write-Host "IMPORTANT: verify the APK includes the GGUF, then install and test offline inference." -ForegroundColor Yellow
