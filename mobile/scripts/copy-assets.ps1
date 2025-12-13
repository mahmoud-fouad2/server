# PowerShell script to copy assets from client public to mobile assets
$source = "..\client\public\logo2.png"
$dest = ".\assets\logo2.png"
if (Test-Path $source) {
    Copy-Item -Path $source -Destination $dest -Force
    Write-Output "Copied $source to $dest"
} else {
    Write-Error "Source file not found: $source"
}
