# PowerShell Script to Test Learner Model API Endpoints
# Make sure your server is running on http://localhost:3001

$baseUrl = "http://localhost:3001"
$token = ""

Write-Host "=== Testing Learner Model API ===" -ForegroundColor Cyan
Write-Host ""

# Step 1: Login to get token
Write-Host "1. Logging in..." -ForegroundColor Yellow
try {
    $loginBody = @{
        email = "sneha@demo.com"
        password = "password"
    } | ConvertTo-Json

    $loginResponse = Invoke-RestMethod -Uri "$baseUrl/api/login" `
        -Method POST `
        -ContentType "application/json" `
        -Body $loginBody

    $token = $loginResponse.token
    Write-Host "[OK] Login successful! Token: $($token.Substring(0, 20))..." -ForegroundColor Green
    Write-Host ""
} catch {
    Write-Host "[X] Login failed. Using demo_token instead." -ForegroundColor Red
    $token = "demo_token"
    Write-Host ""
}

# Step 2: Update Concept Mastery
Write-Host "2. Testing: Update Concept Mastery" -ForegroundColor Yellow
try {
    $masteryBody = @{
        conceptName = "linear_equations"
        isCorrect = $true
        timeSpent = 45
        errorType = "calculation"
    } | ConvertTo-Json

    $masteryResponse = Invoke-RestMethod -Uri "$baseUrl/api/learner/update-mastery" `
        -Method POST `
        -Headers @{
            "Authorization" = "Bearer $token"
            "Content-Type" = "application/json"
        } `
        -Body $masteryBody

    Write-Host "[OK] Success!" -ForegroundColor Green
    Write-Host "  Mastery Level: $($masteryResponse.data.mastery_level)" -ForegroundColor Gray
    Write-Host "  Confidence: $($masteryResponse.data.confidence_score)" -ForegroundColor Gray
    Write-Host "  Attempts: $($masteryResponse.data.attempts_count)" -ForegroundColor Gray
    Write-Host ""
} catch {
    Write-Host "[X] Failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
}

# Step 3: Get Knowledge State
Write-Host "3. Testing: Get Knowledge State" -ForegroundColor Yellow
try {
    $knowledgeResponse = Invoke-RestMethod -Uri "$baseUrl/api/learner/knowledge-state" `
        -Method GET `
        -Headers @{
            "Authorization" = "Bearer $token"
        }

    Write-Host "[OK] Success!" -ForegroundColor Green
    Write-Host "  Overall Mastery Score: $($knowledgeResponse.data.overall_mastery_score)" -ForegroundColor Gray
    Write-Host "  Mastered Concepts: $($knowledgeResponse.data.mastered_concepts.Count)" -ForegroundColor Gray
    Write-Host "  Learning Concepts: $($knowledgeResponse.data.learning_concepts.Count)" -ForegroundColor Gray
    Write-Host "  Weak Concepts: $($knowledgeResponse.data.weak_concepts.Count)" -ForegroundColor Gray
    Write-Host ""
    
    if ($knowledgeResponse.data.mastered_concepts.Count -gt 0) {
        Write-Host "  Sample Mastered Concepts:" -ForegroundColor Cyan
        $knowledgeResponse.data.mastered_concepts | Select-Object -First 3 | ForEach-Object {
            Write-Host "    - $($_.concept_name): $($_.mastery_level)" -ForegroundColor Gray
        }
    }
    Write-Host ""
} catch {
    Write-Host "[X] Failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
}

# Step 4: Get Recommended Difficulty
Write-Host "4. Testing: Get Recommended Difficulty" -ForegroundColor Yellow
try {
    $subject = "Mathematics"
    $difficultyResponse = Invoke-RestMethod -Uri "$baseUrl/api/learner/recommended-difficulty?subject=$subject" `
        -Method GET `
        -Headers @{
            "Authorization" = "Bearer $token"
        }

    Write-Host "[OK] Success!" -ForegroundColor Green
    Write-Host "  Recommended Difficulty: $($difficultyResponse.data.difficulty)" -ForegroundColor Gray
    Write-Host "  Source: $($difficultyResponse.data.source)" -ForegroundColor Gray
    Write-Host "  Confidence: $($difficultyResponse.data.confidence)" -ForegroundColor Gray
    Write-Host ""
} catch {
    Write-Host "[X] Failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
}

# Step 5: Update Learning Profile
Write-Host "5. Testing: Update Learning Profile" -ForegroundColor Yellow
try {
    $profileBody = @{
        timeSpent = 300
        questionsAnswered = 10
        correctAnswers = 8
        modality = "visual"
    } | ConvertTo-Json

    $profileResponse = Invoke-RestMethod -Uri "$baseUrl/api/learner/update-profile" `
        -Method POST `
        -Headers @{
            "Authorization" = "Bearer $token"
            "Content-Type" = "application/json"
        } `
        -Body $profileBody

    Write-Host "[OK] Success!" -ForegroundColor Green
    Write-Host "  Learning Velocity: $($profileResponse.data.average_learning_velocity) questions/min" -ForegroundColor Gray
    Write-Host "  Optimal Difficulty: $($profileResponse.data.optimal_difficulty_level)" -ForegroundColor Gray
    Write-Host "  Engagement Score: $($profileResponse.data.engagement_score)" -ForegroundColor Gray
    Write-Host "  Preferred Style: $($profileResponse.data.preferred_learning_style)" -ForegroundColor Gray
    Write-Host ""
} catch {
    Write-Host "[X] Failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
}

Write-Host "=== Testing Complete ===" -ForegroundColor Cyan
