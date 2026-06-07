$ErrorActionPreference = "Stop"

& (Join-Path $PSScriptRoot "init.ps1")
& (Join-Path $PSScriptRoot "handoff.ps1")

$Root = (Resolve-Path (Join-Path $PSScriptRoot "../..")).Path
$NpmCommand = if ($IsWindows) { "npm.cmd" } else { "npm" }

Push-Location $Root
try {
  & $NpmCommand run build
  if ($LASTEXITCODE -ne 0) {
    throw "npm run build failed with exit code $LASTEXITCODE."
  }
} finally {
  Pop-Location
}

Write-Host "Harness baseline check passed."
