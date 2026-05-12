# Deploy Firestore (regras + índices) no Windows com token CI.
# Uso: na raiz do repo, após preencher .env.firebase.local:
#   .\scripts\deploy-firestore.ps1
$ErrorActionPreference = 'Stop'

$RepoRoot = Split-Path -Parent $PSScriptRoot
Set-Location $RepoRoot

$envFile = Join-Path $RepoRoot '.env.firebase.local'
if (Test-Path $envFile) {
    Get-Content $envFile | ForEach-Object {
        $line = $_.Trim()
        if ($line -match '^\s*#' -or $line -eq '') { return }
        $eq = $line.IndexOf('=')
        if ($eq -gt 0) {
            $key = $line.Substring(0, $eq).Trim()
            $val = $line.Substring($eq + 1).Trim()
            Set-Item -Path "Env:$key" -Value $val
        }
    }
}

if (-not $env:FIREBASE_TOKEN) {
    Write-Error 'FIREBASE_TOKEN em falta. Execute npx firebase-tools login:ci ou edite .env.firebase.local (ver scripts\firebase-env.example).'
}
if (-not $env:FIREBASE_PROJECT_ID) {
    Write-Error 'FIREBASE_PROJECT_ID em falta.'
}

npx --yes firebase-tools@latest deploy `
    --only firestore `
    --project $env:FIREBASE_PROJECT_ID `
    --token $env:FIREBASE_TOKEN `
    --non-interactive
