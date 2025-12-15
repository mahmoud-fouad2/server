param(
  [string]$HookUrl = $env:FRONTEND_DEPLOY_HOOK
)

if (-not $HookUrl) {
  Write-Error "No deploy hook URL provided. Pass as first argument or set FRONTEND_DEPLOY_HOOK env var."
  exit 2
}

Write-Output "Triggering frontend deploy hook: $HookUrl"
try {
  $resp = Invoke-RestMethod -Method Post -Uri $HookUrl -UseBasicParsing -ErrorAction Stop
  Write-Output "Deploy hook triggered successfully. Response:" 
  if ($resp) { $resp | ConvertTo-Json -Depth 5 | Write-Output }
  exit 0
} catch {
  Write-Error "Failed to trigger deploy hook: $_"
  exit 1
}
