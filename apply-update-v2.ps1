# apply-update.ps1
#
# Run this from INSIDE your freshly-cloned nexora-core folder, after
# placing nexora-payment-system-update.zip in that same folder.
#
# It extracts the zip and overwrites/adds the changed files automatically -
# no manual file-by-file copying needed.

$zipPath = ".\nexora-payment-system-update.zip"
$extractPath = ".\_update-temp"

if (-not (Test-Path $zipPath)) {
    Write-Host "ERROR: nexora-payment-system-update.zip not found in the current folder." -ForegroundColor Red
    Write-Host "Move the zip into this folder first, then re-run this script." -ForegroundColor Red
    exit 1
}

Write-Host "Extracting update package..." -ForegroundColor Cyan
if (Test-Path $extractPath) { Remove-Item $extractPath -Recurse -Force }
Expand-Archive -Path $zipPath -DestinationPath $extractPath -Force

Write-Host "Copying files into the project (overwriting changed ones)..." -ForegroundColor Cyan
Copy-Item -Path "$extractPath\*" -Destination "." -Recurse -Force

Remove-Item $extractPath -Recurse -Force

Write-Host ""
Write-Host "Done. Files applied:" -ForegroundColor Green
Write-Host "  - New order/payment system (lib/orders, app/api/orders, app/api/cron)"
Write-Host "  - Admin panel (app/[locale]/admin, app/api/admin)"
Write-Host "  - FAQ page (app/[locale]/faq)"
Write-Host "  - Download page (app/[locale]/download)"
Write-Host "  - Updated checkout, dashboard, footer"
Write-Host "  - New GitHub Actions workflow (.github/workflows/check-payments.yml)"
Write-Host "  - docs/PAYMENT_VERIFICATION.md -- READ THIS NEXT for D1/secrets setup"
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. npm install"
Write-Host "  2. npm run build   (sanity check)"
Write-Host "  3. Follow docs\PAYMENT_VERIFICATION.md (D1 database, secrets, wallet addresses)"
Write-Host "  4. git add ."
Write-Host "  5. git commit -m Add-payment-verification-admin-panel-FAQ"
Write-Host "  6. git push origin main"
