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

Write-Host "Parsing @font-face blocks and extracting per-weight urls"

# Split into blocks by @font-face and extract weight + first url() per block
$blocks = $css -split '@font-face' | ForEach-Object { $_.Trim() } | Where-Object { $_ -ne '' }

if ($blocks.Count -eq 0) {
        Write-Host "No @font-face blocks found. Exiting."
        exit 1
}

function Download-WithRetries($url, $outPath) {
    $maxAttempts = 4
    $attempt = 0
    while ($attempt -lt $maxAttempts) {
        $attempt++
        try {
            Write-Host "Attempt" $attempt ":" $url "->" $outPath
            Invoke-WebRequest -Uri $url -OutFile $outPath -Headers @{ 'User-Agent'='Mozilla/5.0 (Windows NT)'} -TimeoutSec 60 -UseBasicParsing -ErrorAction Stop
            return $true
        } catch {
            Write-Warning ("Invoke-WebRequest failed (attempt {0}): {1}" -f $attempt, $_.Exception.Message)
            try {
                Write-Output 'Trying Start-BitsTransfer fallback...'
                Start-BitsTransfer -Source $url -Destination $outPath -ErrorAction Stop
                return $true
            } catch {
                Write-Warning ("BITS fallback failed: {0}" -f $_.Exception.Message)
            }
            Start-Sleep -Seconds ([Math]::Pow(2, $attempt))
        }
    }
    return $false
}

$downloaded = @()
foreach ($b in $blocks) {
        # find weight
        $wMatch = [regex]::Match($b, 'font-weight\s*:\s*(\d+)', 'IgnoreCase')
        if (-not $wMatch.Success) { continue }
        $weight = $wMatch.Groups[1].Value
        # find first url(...)
        $uMatch = [regex]::Match($b, 'url\(([^)]+)\)')
        if (-not $uMatch.Success) { Write-Warning ("No url() for weight {0}" -f $weight); continue }
        $rawUrl = $uMatch.Groups[1].Value.Trim("'\"")
        try {
            $uri = [Uri]$rawUrl
        } catch {
            Write-Warning ("Skipping invalid URL: {0}" -f $rawUrl)
            continue
        }

        # choose filename: prefer predictable name Beiruti-<weight> with original extension
        $ext = [IO.Path]::GetExtension($uri.LocalPath)
        if (-not $ext) { $ext = '.woff2' }
        $baseName = "Beiruti-$weight$ext"
        $out = Join-Path $outDir $baseName
        if (Test-Path $out -and -not $Force) { Write-Host "Already have $baseName"; $downloaded += $baseName; continue }

        $ok = Download-WithRetries $rawUrl $out
        if ($ok) { Write-Host "Saved $baseName"; $downloaded += $baseName } else { Write-Warning ("Failed to download {0}" -f $rawUrl) }
}

Write-Host 'Download phase complete. Files present:'
Get-ChildItem $outDir -File | Select-Object Name, Length | Format-Table -AutoSize

# Convert any downloaded .ttf files to .woff2 using npx ttf2woff2 if Node is available
function Convert-TtfToWoff2 {
    param([string]$dir)
    if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
        Write-Warning 'Node.js not found in PATH. Skipping conversion. Install Node.js to enable conversion.'
        return
    }

    $ttfFiles = Get-ChildItem $dir -Filter *.ttf -File
    if ($ttfFiles.Count -eq 0) { Write-Host 'No .ttf files to convert.'; return }

    foreach ($f in $ttfFiles) {
        $in = $f.FullName
        $out = [IO.Path]::ChangeExtension($in, '.woff2')
        if (Test-Path $out -and -not $Force) { Write-Host "Already have $([IO.Path]::GetFileName($out))"; continue }
        Write-Host "Converting $($f.Name) -> $([IO.Path]::GetFileName($out))"
        $cmd = "npx ttf2woff2 `"$in`" > `"$out`""
        # Use cmd /c to execute redirected output reliably on Windows
        cmd /c $cmd
        if ($LASTEXITCODE -ne 0) { Write-Warning "Conversion failed for $($f.Name). Ensure ttf2woff2 can run via npx." } else { Write-Host "Converted: $out" }
    }
}

Write-Host 'Starting optional conversion step (TTF -> WOFF2)'
Convert-TtfToWoff2 -dir $outDir

Write-Host 'All done. Check client/public/fonts for .woff2 files.'
