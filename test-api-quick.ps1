# Quick PowerShell Commands for Testing API
# Copy and paste these one at a time into PowerShell

# ============================================
# 1. LOGIN (Get Token)
# ============================================
$loginBody = @{ email = "sneha@demo.com"; password = "password" } | ConvertTo-Json
$response = Invoke-RestMethod -Uri "http://localhost:3001/api/login" -Method POST -ContentType "application/json" -Body $loginBody
$token = $response.token
Write-Host "Token: $token" -ForegroundColor Green

# ============================================
# 2. UPDATE CONCEPT MASTERY
# ============================================
$body = @{
    conceptName = "linear_equations"
    isCorrect = $true
    timeSpent = 45
    errorType = "calculation"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3001/api/learner/update-mastery" `
    -Method POST `
    -Headers @{ "Authorization" = "Bearer $token"; "Content-Type" = "application/json" } `
    -Body $body

# ============================================
# 3. GET KNOWLEDGE STATE
# ============================================
Invoke-RestMethod -Uri "http://localhost:3001/api/learner/knowledge-state" `
    -Method GET `
    -Headers @{ "Authorization" = "Bearer $token" }

# ============================================
# 4. GET RECOMMENDED DIFFICULTY
# ============================================
Invoke-RestMethod -Uri "http://localhost:3001/api/learner/recommended-difficulty?subject=Mathematics" `
    -Method GET `
    -Headers @{ "Authorization" = "Bearer $token" }

# ============================================
# 5. UPDATE LEARNING PROFILE
# ============================================
$body = @{
    timeSpent = 300
    questionsAnswered = 10
    correctAnswers = 8
    modality = "visual"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3001/api/learner/update-profile" `
    -Method POST `
    -Headers @{ "Authorization" = "Bearer $token"; "Content-Type" = "application/json" } `
    -Body $body
