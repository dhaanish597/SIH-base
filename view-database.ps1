# PowerShell script to view learner model data from SQLite database

$dbPath = ".\server\data\local_analytics.db"

Write-Host "=== Viewing Learner Model Data ===" -ForegroundColor Cyan
Write-Host "Database: $dbPath" -ForegroundColor Gray
Write-Host ""

# Check if database exists
if (-not (Test-Path $dbPath)) {
    Write-Host "[X] Database not found at: $dbPath" -ForegroundColor Red
    Write-Host "Make sure the server has been started at least once." -ForegroundColor Yellow
    exit
}

Write-Host "[OK] Database found!" -ForegroundColor Green
Write-Host ""

# View Concept Mastery
Write-Host "=== Concept Mastery ===" -ForegroundColor Yellow
$conceptQuery = "SELECT student_id, concept_name, mastery_level, confidence_score, attempts_count, correct_count, last_practiced FROM concept_mastery ORDER BY last_practiced DESC;"
$conceptResult = sqlite3 $dbPath $conceptQuery
if ($conceptResult) {
    Write-Host $conceptResult -ForegroundColor White
} else {
    Write-Host "No concept mastery records found." -ForegroundColor Gray
}
Write-Host ""

# View Learning Profile
Write-Host "=== Learning Profile ===" -ForegroundColor Yellow
$profileQuery = "SELECT student_id, preferred_learning_style, average_learning_velocity, optimal_difficulty_level, engagement_score, last_updated FROM student_learning_profile;"
$profileResult = sqlite3 $dbPath $profileQuery
if ($profileResult) {
    Write-Host $profileResult -ForegroundColor White
} else {
    Write-Host "No learning profile records found." -ForegroundColor Gray
}
Write-Host ""

# Count records
Write-Host "=== Summary ===" -ForegroundColor Yellow
$countQuery = "SELECT 
    (SELECT COUNT(*) FROM concept_mastery) as concepts,
    (SELECT COUNT(*) FROM student_learning_profile) as profiles;"
$countResult = sqlite3 $dbPath $countQuery
Write-Host "Total Concepts Tracked: $($countResult.Split('|')[0])" -ForegroundColor Cyan
Write-Host "Total Profiles: $($countResult.Split('|')[1])" -ForegroundColor Cyan
Write-Host ""

Write-Host "=== Done ===" -ForegroundColor Cyan
