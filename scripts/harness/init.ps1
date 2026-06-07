$ErrorActionPreference = "Stop"

$Root = (Resolve-Path (Join-Path $PSScriptRoot "../..")).Path

$RequiredFiles = @(
  "AGENTS.md",
  "README.md",
  ".env.example",
  "package.json",
  "package-lock.json",
  "index.html",
  "tsconfig.json",
  "vite.config.ts",
  "src/main.tsx",
  "src/App.tsx",
  "src/api.ts",
  "src/data.ts",
  "src/types.ts",
  "src/styles.css",
  "src/vite-env.d.ts",
  "server/config.mjs",
  "server/http.mjs",
  "server/index.mjs",
  "server/providers/textModel.mjs",
  "server/providers/runningHub.mjs",
  "scripts/dev.mjs",
  "docs/harness/project_brief.md",
  "docs/harness/feature_list.json",
  "docs/harness/progress.md",
  "docs/harness/handoff.md",
  "docs/harness/decisions.md",
  "docs/harness/verification.md",
  "docs/harness/pitfalls.md",
  "docs/harness/architecture_rules.md",
  "scripts/harness/init.ps1",
  "scripts/harness/handoff.ps1",
  "scripts/harness/check.ps1",
  "scripts/harness/init.mjs",
  "scripts/harness/handoff.mjs",
  "scripts/harness/check.mjs",
  "scripts/harness/http_smoke.mjs"
)

foreach ($RelativePath in $RequiredFiles) {
  $Path = Join-Path $Root $RelativePath
  if (-not (Test-Path -LiteralPath $Path -PathType Leaf)) {
    throw "Missing required Harness file: $RelativePath"
  }
}

$FeaturePath = Join-Path $Root "docs/harness/feature_list.json"
try {
  $FeatureList = Get-Content -LiteralPath $FeaturePath -Raw | ConvertFrom-Json
} catch {
  throw "docs/harness/feature_list.json is not valid JSON: $($_.Exception.Message)"
}

$AllowedStatuses = @(
  "not_started",
  "in_progress",
  "ready_for_review",
  "done",
  "blocked"
)

$ConfiguredStatuses = @($FeatureList.status_values)
foreach ($Status in $AllowedStatuses) {
  if ($ConfiguredStatuses -notcontains $Status) {
    throw "feature_list.json status_values must include '$Status'"
  }
}

$Features = @($FeatureList.features)
if ($Features.Count -lt 1) {
  throw "feature_list.json must include at least one feature."
}

foreach ($Feature in $Features) {
  if ([string]::IsNullOrWhiteSpace($Feature.id)) {
    throw "Every feature must have a non-empty id."
  }

  if ([string]::IsNullOrWhiteSpace($Feature.title)) {
    throw "Feature '$($Feature.id)' must have a non-empty title."
  }

  if ($AllowedStatuses -notcontains $Feature.status) {
    throw "Feature '$($Feature.id)' has invalid status '$($Feature.status)'."
  }

  if (@($Feature.definition_of_done).Count -lt 1) {
    throw "Feature '$($Feature.id)' must have at least one definition_of_done item."
  }
}

Write-Host "Harness init check passed for $($FeatureList.project)."
