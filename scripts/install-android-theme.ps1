# Script de Instalação - Sistema de Tema Android
# Autor: Workflow Team
# Data: 07/10/2025

Write-Host "🎨 Instalando Sistema de Tema Dinâmico para Android..." -ForegroundColor Cyan
Write-Host ""

# 1. Instalar dependências do Capacitor
Write-Host "📦 Instalando plugins do Capacitor..." -ForegroundColor Yellow
npm install @capacitor/status-bar @capacitor/splash-screen

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erro ao instalar dependências!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Plugins instalados com sucesso!" -ForegroundColor Green
Write-Host ""

# 2. Sincronizar com Android
Write-Host "🔄 Sincronizando com Android..." -ForegroundColor Yellow
npx cap sync android

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erro ao sincronizar com Android!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Sincronização concluída!" -ForegroundColor Green
Write-Host ""

# 3. Verificar estrutura de arquivos
Write-Host "🔍 Verificando arquivos criados..." -ForegroundColor Yellow

$requiredFiles = @(
    "src\hooks\useAndroidTheme.js",
    "android\app\src\main\java\br\workflow\app\MainActivity.java",
    "android\app\src\main\java\br\workflow\app\plugins\ThemeManagerPlugin.java",
    "android\app\src\main\res\values\colors.xml",
    "android\app\src\main\res\values\styles.xml",
    "android\app\src\main\res\drawable\splash_light.xml",
    "android\app\src\main\res\drawable\splash_dark.xml"
)

$allFilesExist = $true
foreach ($file in $requiredFiles) {
    if (Test-Path $file) {
        Write-Host "  ✓ $file" -ForegroundColor Green
    } else {
        Write-Host "  ✗ $file" -ForegroundColor Red
        $allFilesExist = $false
    }
}

Write-Host ""

if (-not $allFilesExist) {
    Write-Host "⚠️  Alguns arquivos não foram encontrados!" -ForegroundColor Yellow
    Write-Host "   Execute os comandos manualmente conforme a documentação." -ForegroundColor Yellow
    Write-Host ""
}

# 4. Instruções finais
Write-Host "📝 Próximos Passos:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Configure o AndroidManifest.xml:" -ForegroundColor White
Write-Host "   - Abra: android/app/src/main/AndroidManifest.xml" -ForegroundColor Gray
Write-Host "   - Adicione o meta-data do plugin ThemeManager" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Build do projeto:" -ForegroundColor White
Write-Host "   npm run build" -ForegroundColor Gray
Write-Host "   npx cap copy android" -ForegroundColor Gray
Write-Host "   npx cap sync android" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Abra no Android Studio:" -ForegroundColor White
Write-Host "   npx cap open android" -ForegroundColor Gray
Write-Host ""
Write-Host "4. Execute no dispositivo e teste:" -ForegroundColor White
Write-Host "   - Abra o app" -ForegroundColor Gray
Write-Host "   - Toggle o tema" -ForegroundColor Gray
Write-Host "   - Observe a mudança instantânea!" -ForegroundColor Gray
Write-Host ""
Write-Host "✨ Instalação concluída! Consulte docs/SISTEMA_TEMA_ANDROID.md para mais detalhes." -ForegroundColor Green
Write-Host ""
