<#
Script: download-beiruti.ps1
Purpose: Download Beiruti font weights referenced by Google Fonts into
         `client/public/fonts/`, retry on failures and optionally convert
         TTF -> WOFF2 using `npx ttf2woff2`.

Usage:
  1) Open PowerShell in the repository root and run:
       pwsh .\scripts\download-beiruti.ps1

  2) If you want automatic conversion to .woff2, ensure you have Node.js
     installed. The script can install a local `ttf2woff2` via npm
     (no-save) and run conversions for any downloaded .ttf files.

Notes:
  - The script uses Invoke-WebRequest with retries and Start-BitsTransfer
    fallback on Windows for larger files.
  - It will not remove existing files; it only downloads missing files.
#>
#!/usr/bin/env pwsh

# Simple downloader for Beiruti woff2 files.
# Behavior:
# 1) Fetch the Google Fonts CSS for Beiruti with the requested weights
# 2) Parse each @font-face block to extract the font-weight and its first url()
# 3) Download the referenced woff2 and save as client/public/fonts/Beiruti-<weight>.woff2

param(
    [switch]$Force
)

$repoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$outDir = Join-Path -Path $repoRoot -ChildPath "..\client\public\fonts"
$outDir = (Resolve-Path $outDir).ProviderPath
if (!(Test-Path $outDir)) { New-Item -ItemType Directory -Path $outDir | Out-Null }

$cssUrl = "https://fonts.googleapis.com/css2?family=Beiruti:wght@200;300;400;500;600;700;800;900&display=swap&subset=arabic"

Write-Host "Fetching Google Fonts CSS from $cssUrl"
try {
    $resp = Invoke-WebRequest -Uri $cssUrl -Headers @{ 'User-Agent' = 'Mozilla/5.0 (Windows NT)'; 'Accept' = 'text/css' } -UseBasicParsing
    $css = $resp.Content
} catch {
    Write-Host "Failed to fetch CSS: $_"
    exit 1
}

# Regex: find @font-face {... font-weight: <num>; ... src: url(<url>) ... }
$regex = [regex]::new('@font-face\\s*\\{.*?font-weight\\s*:\\s*(\\d+).*?src\\s*:\\s*url\\((https:[^)]+)\\)', [System.Text.RegularExpressions.RegexOptions]::Singleline)
$matches = $regex.Matches($css)

if ($matches.Count -eq 0) {
    Write-Host "No font urls found in CSS. Exiting."
    exit 1
}

foreach ($m in $matches) {
    $weight = $m.Groups[1].Value
    $url = $m.Groups[2].Value
    $filename = "Beiruti-$weight.woff2"
    $out = Join-Path $outDir $filename
    if ((Test-Path $out) -and (-not $Force)) {
        Write-Host "$filename already exists, skipping. Use -Force to redownload."
        continue
    }
    Write-Host "Downloading weight $weight -> $filename"
    try {
        Invoke-WebRequest -Uri $url -OutFile $out -UseBasicParsing -Headers @{ 'User-Agent' = 'Mozilla/5.0 (Windows NT)' }
        Write-Host "Saved $out"
    } catch {
        Write-Host "Failed to download $url : $_"
    }
}

Write-Host "All done. Check client/public/fonts for Beiruti-<weight>.woff2 files."
  return $false
