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

Set-StrictMode -Version Latest
Write-Output "Starting Beiruti font downloader..."

# Ensure TLS1.2+ for secure downloads
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12 -bor [Net.SecurityProtocolType]::Tls11 -bor [Net.SecurityProtocolType]::Tls

$root = Split-Path -Parent $MyInvocation.MyCommand.Definition
Set-Location $root

$clientFontsDir = Join-Path $root 'client\public\fonts'
if (-not (Test-Path $clientFontsDir)) { New-Item -ItemType Directory -Path $clientFontsDir -Force | Out-Null }

$cssUrl = 'https://fonts.googleapis.com/css2?family=Beiruti:wght@200;300;400;500;600;700;800;900&display=swap&subset=arabic'
Write-Output "Fetching CSS from: $cssUrl"

try {
  $cssResp = Invoke-WebRequest -Uri $cssUrl -Headers @{ 'User-Agent' = 'Mozilla/5.0 (Windows NT)'; 'Accept' = 'text/css' } -UseBasicParsing -TimeoutSec 30
} catch {
  Write-Error "Failed to fetch Google Fonts CSS: $($_.Exception.Message)"
  exit 1
}

$body = $cssResp.Content

# Extract url(...) occurrences and filter data: URIs
[regex]$re = 'url\(([^)]+)\)'
$matches = $re.Matches($body) | ForEach-Object { $_.Groups[1].Value.Trim("'\"") } | Where-Object { -not ($_ -like 'data:*') } | Sort-Object -Unique

if ($matches.Count -eq 0) {
  Write-Output 'No font urls found in CSS.'
  exit 0
}

function Download-WithRetries($url, $outPath) {
  $maxAttempts = 4
  $attempt = 0
  while ($attempt -lt $maxAttempts) {
    $attempt++
    try {
      Write-Output "Attempt $attempt: $url -> $outPath"
      Invoke-WebRequest -Uri $url -OutFile $outPath -Headers @{ 'User-Agent'='Mozilla/5.0 (Windows NT)'} -TimeoutSec 60 -UseBasicParsing -ErrorAction Stop
      return $true
    } catch {
      Write-Warning "Invoke-WebRequest failed (attempt $attempt): $($_.Exception.Message)"
      # Try BITS fallback (robust on Windows)
      try {
        Write-Output "Trying Start-BitsTransfer fallback..."
        Start-BitsTransfer -Source $url -Destination $outPath -ErrorAction Stop
        return $true
      } catch {
        Write-Warning "BITS fallback failed: $($_.Exception.Message)"
      }
      Start-Sleep -Seconds ([Math]::Pow(2, $attempt))
    }
  }
  return $false
}

$downloaded = @()
foreach ($u in $matches) {
  try { $uri = [Uri]$u } catch { Write-Warning "Skipping invalid URL: $u"; continue }
  $filename = [IO.Path]::GetFileName($uri.LocalPath)
  if (-not $filename) { Write-Warning "Skipping empty filename for $u"; continue }
  $out = Join-Path $clientFontsDir $filename
  if (Test-Path $out) { Write-Output "Already have $filename"; $downloaded += $filename; continue }
  $ok = Download-WithRetries $u $out
  if ($ok) { Write-Output "Saved $filename"; $downloaded += $filename } else { Write-Error "Failed to download $u" }
}

Write-Output 'Download phase complete. Files present:'
Get-ChildItem $clientFontsDir -File | Select-Object Name, Length | Format-Table -AutoSize

# Optional conversion: TTF -> WOFF2 using npx ttf2woff2
function Convert-TtfToWoff2 {
  param([string]$dir)
  if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Warning 'Node.js not found in PATH. Skipping conversion. Install Node.js to enable conversion.'
    return
  }

  # Ensure ttf2woff2 available via npx (will download if necessary)
  $ttfFiles = Get-ChildItem $dir -Filter *.ttf -File
  if ($ttfFiles.Count -eq 0) { Write-Output 'No .ttf files to convert.'; return }

  foreach ($f in $ttfFiles) {
    $in = $f.FullName
    $out = [IO.Path]::ChangeExtension($in, '.woff2')
    if (Test-Path $out) { Write-Output "Already have $($out -replace '\\','/')"; continue }
    Write-Output "Converting $($f.Name) -> $([IO.Path]::GetFileName($out))"
    # npx ttf2woff2 writes woff2 to stdout; redirect to file
    $cmd = "npx ttf2woff2 `"$in`" > `"$out`""
    $res = cmd /c $cmd
    if ($LASTEXITCODE -ne 0) { Write-Warning "Conversion failed for $($f.Name). Ensure ttf2woff2 can run via npx." } else { Write-Output "Converted: $out" }
  }
}

Write-Output 'Starting optional conversion step (TTF -> WOFF2)'
Convert-TtfToWoff2 -dir $clientFontsDir

Write-Output 'All done. Next steps:'
Write-Output " - Check $clientFontsDir for .woff2 files."
Write-Output " - If .woff2 files exist, update client/public/.htaccess to preload the .woff2 files (or let next/font handle optimization)."
Write-Output " - Commit and push the new files if you want them in the repo."

exit 0
