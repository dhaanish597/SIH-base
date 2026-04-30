# PowerShell script to view learner model data in a formatted way

$dbPath = ".\server\data\local_analytics.db"

Write-Host "`n=== Learner Model Database Viewer ===" -ForegroundColor Cyan
Write-Host ""

# Check if database exists
if (-not (Test-Path $dbPath)) {
    Write-Host "[X] Database not found at: $dbPath" -ForegroundColor Red
    Write-Host "Make sure the server has been started at least once." -ForegroundColor Yellow
    exit
}

Write-Host "[OK] Database found!`n" -ForegroundColor Green

# View Concept Mastery with headers
Write-Host "=== CONCEPT MASTERY ===" -ForegroundColor Yellow
Write-Host ""

$conceptData = sqlite3 -header -column $dbPath "SELECT 
    concept_name AS 'Concept',
    ROUND(mastery_level, 2) AS 'Mastery',
    ROUND(confidence_score, 2) AS 'Confidence',
    attempts_count AS 'Attempts',
    correct_count AS 'Correct',
    datetime(last_practiced) AS 'Last Practiced'
FROM concept_mastery 
ORDER BY last_practiced DESC;"

if ($conceptData) {
    Write-Host $conceptData -ForegroundColor White
} else {
    Write-Host "No concept mastery records found." -ForegroundColor Gray
}

Write-Host "`n"

# View Learning Profile with headers
Write-Host "=== LEARNING PROFILE ===" -ForegroundColor Yellow
Write-Host ""

$profileData = sqlite3 -header -column $dbPath "SELECT 
    preferred_learning_style AS 'Style',
    ROUND(average_learning_velocity, 2) AS 'Velocity (q/min)',
    ROUND(optimal_difficulty_level, 2) AS 'Difficulty',
    ROUND(engagement_score, 2) AS 'Engagement',
    datetime(last_updated) AS 'Last Updated'
FROM student_learning_profile;"

if ($profileData) {
    Write-Host $profileData -ForegroundColor White
} else {
    Write-Host "No learning profile records found." -ForegroundColor Gray
}

Write-Host "`n"

# Summary
Write-Host "=== SUMMARY ===" -ForegroundColor Yellow
$conceptCount = (sqlite3 $dbPath "SELECT COUNT(*) FROM concept_mastery;")
$profileCount = (sqlite3 $dbPath "SELECT COUNT(*) FROM student_learning_profile;")
$avgMastery = (sqlite3 $dbPath "SELECT ROUND(AVG(mastery_level), 2) FROM concept_mastery;")

Write-Host "Concepts Tracked: $conceptCount" -ForegroundColor Cyan
Write-Host "Learning Profiles: $profileCount" -ForegroundColor Cyan
if ($avgMastery) {
    Write-Host "Average Mastery: $avgMastery" -ForegroundColor Cyan
}

Write-Host "`n=== Done ===`n" -ForegroundColor Cyan
