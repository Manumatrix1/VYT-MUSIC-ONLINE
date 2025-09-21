# Script de deploy automático para Windows PowerShell
# Uso: .\deploy.ps1 [tipo]
# tipos: all, functions, hosting

param(
    [string]$DeployType = "all"
)

$branch = git branch --show-current
Write-Host "🔍 Branch actual: $branch" -ForegroundColor Cyan
Write-Host "📦 Tipo de deploy: $DeployType" -ForegroundColor Cyan

if ($branch -eq "main") {
    Write-Host "🚀 Desplegando a PRODUCCIÓN (vyt-online)..." -ForegroundColor Green
    switch ($DeployType) {
        "all" { npm run deploy:prod }
        "functions" { npm run deploy:functions:prod }
        "hosting" { npm run deploy:hosting:prod }
        default { npm run deploy:prod }
    }
} elseif ($branch -eq "prueva-online") {
    Write-Host "🧪 Desplegando a DESARROLLO (vytonlineprueva)..." -ForegroundColor Yellow
    switch ($DeployType) {
        "all" { npm run deploy:dev }
        "functions" { npm run deploy:functions:dev }
        "hosting" { npm run deploy:hosting:dev }
        default { npm run deploy:dev }
    }
} else {
    Write-Host "❌ Branch no reconocido. Solo se puede deployar desde 'main' o 'prueva-online'" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Deploy completado!" -ForegroundColor Green