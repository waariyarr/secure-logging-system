# Start MongoDB with a project-local data directory (fixes missing C:\data\db on Windows).
# Run from repo root: npm run mongo:local

$ErrorActionPreference = "Stop"
$repoRoot = Split-Path -Parent $PSScriptRoot
$dataPath = Join-Path $repoRoot "data\db"

if (-not (Test-Path $dataPath)) {
  New-Item -ItemType Directory -Force -Path $dataPath | Out-Null
  Write-Host "Created data directory: $dataPath"
}

Write-Host "Starting mongod with --dbpath $dataPath"
Write-Host "Press Ctrl+C to stop."
& mongod --dbpath $dataPath
