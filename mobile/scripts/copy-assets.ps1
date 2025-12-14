# PowerShell script to copy assets from client public to mobile assets
$source = "..\client\public\logo2.png"
$dest = ".\assets\logo2.png"
if (Test-Path $source) {
    Copy-Item -Path $source -Destination $dest -Force
    Write-Output "Copied $source to $dest"
} else {
    Write-Error "Source file not found: $source"
}
# Also copy transparent logo if present at repo root
$possible = @(
    "..\..\logo transpart.png",
    "..\..\github app\logo transpart.png",
    "..\..\github\logo transpart.png",
    "..\client\public\logo transpart.png",
    "..\client\public\logo-transparent.png",
    "..\..\logo-transparent.png"
)
$dest2 = ".\assets\logo-transparent.png"
$found = $false
foreach ($p in $possible) {
    if (Test-Path $p) {
        Copy-Item -Path $p -Destination $dest2 -Force
        Write-Output "Copied $p to $dest2"
        $found = $true
        break
    }
}
if (-not $found) {
    Write-Output "Transparent logo not found in common locations; please copy your transparent PNG to $dest2 or run this script from the repo root where the file is located."
}
