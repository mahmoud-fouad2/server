# PowerShell Script to Run Seed on Render
# Run this after redeploying the service on Render

# Step 1: Login as admin (replace PASSWORD with your admin password)
$adminPassword = "Doda@55002004"  # Your admin password

$loginBody = @{
    email = "admin@faheemly.com"
    password = $adminPassword
} | ConvertTo-Json

$loginResponse = Invoke-RestMethod -Method Post -Uri 'https://fahimo-api.onrender.com/api/auth/login' -ContentType 'application/json' -Body $loginBody
$token = $loginResponse.token

Write-Host "Logged in, Token: $token"

# Step 2: Run the seed
$seedResponse = Invoke-RestMethod -Method Post -Uri 'https://fahimo-api.onrender.com/api/admin/run-seed' -Headers @{ Authorization = "Bearer $token" } -ContentType 'application/json'

Write-Host "Seed Response:"
$seedResponse | ConvertTo-Json

# Step 3: Get demo login for businessId
$demoLoginBody = @{
    email = "hello@faheemly.com"
    password = "FaheemlyDemo2025!"
} | ConvertTo-Json

$demoResponse = Invoke-RestMethod -Method Post -Uri 'https://fahimo-api.onrender.com/api/auth/demo-login' -ContentType 'application/json' -Body $demoLoginBody

Write-Host "Demo Login Response:"
$demoResponse | ConvertTo-Json

Write-Host "Use businessId: $($demoResponse.businessId) in your widget"