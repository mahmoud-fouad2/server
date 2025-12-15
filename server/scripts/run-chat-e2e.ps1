# Run a simple E2E chat test against a running server
# Usage:
#   $env:BASE_URL='https://my-deployed-api.com'; .\run-chat-e2e.ps1 -BusinessId '<BUSINESS_ID>' -Message 'فين فرعكم؟'
param(
  [Parameter(Mandatory=$true)] [string] $BusinessId,
  [Parameter(Mandatory=$false)] [string] $Message = 'فين فرعكم؟',
  [string] $BaseUrl = $env:BASE_URL
)

if (-not $BaseUrl) {
  Write-Error "BASE_URL not set. Export environment variable BASE_URL or pass -BaseUrl param."
  exit 1
}

$endpoint = "$BaseUrl/api/chat/message"
$payload = @{ message = $Message; businessId = $BusinessId } | ConvertTo-Json

Write-Host "POST $endpoint with businessId=$BusinessId"

try {
  $resp = Invoke-RestMethod -Uri $endpoint -Method Post -Body $payload -ContentType 'application/json' -TimeoutSec 60
  Write-Host "Response:" -ForegroundColor Green
  $resp | ConvertTo-Json -Depth 5 | Write-Host
} catch {
  Write-Error "Request failed: $_"
  exit 1
}
