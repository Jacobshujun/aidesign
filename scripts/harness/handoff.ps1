$ErrorActionPreference = "Stop"

$Root = (Resolve-Path (Join-Path $PSScriptRoot "../..")).Path

$RequiredFiles = @(
  "docs/harness/handoff.md",
  "docs/harness/progress.md",
  "docs/harness/feature_list.json"
)

foreach ($RelativePath in $RequiredFiles) {
  $Path = Join-Path $Root $RelativePath
  if (-not (Test-Path -LiteralPath $Path -PathType Leaf)) {
    throw "Missing handoff file: $RelativePath"
  }
}

$FeaturePath = Join-Path $Root "docs/harness/feature_list.json"
try {
  $FeatureList = Get-Content -LiteralPath $FeaturePath -Raw | ConvertFrom-Json
} catch {
  throw "docs/harness/feature_list.json is not valid JSON: $($_.Exception.Message)"
}

foreach ($Feature in @($FeatureList.features)) {
  if ($Feature.status -eq "done") {
    $Evidence = @($Feature.evidence)
    if ($Evidence.Count -lt 1) {
      throw "Feature '$($Feature.id)' is done but has no evidence."
    }
  }
}

Write-Host "Harness handoff check passed."
