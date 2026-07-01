Set-Location d:\r\asa-dashboard-ui
npx tsc -b --noEmit 2>&1 | Out-File -FilePath tsc-errors3.txt -Encoding UTF8
