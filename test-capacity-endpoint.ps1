#!/usr/bin/env pwsh
# Test script for Capacity Analysis endpoint

Write-Host "Testing Capacity Analysis Endpoint" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan
Write-Host ""

# Wait for server to be ready
Write-Host "Waiting for API server to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 2

$uri = "http://localhost:4000/api/leave-approval/capacity"
$testData = @{
    candidates = @(
        @{
            id = "emp1"
            name = "John Doe"
            current_load = 0
            skills = @("engineering")
            role_level = "senior"
            avg_completion_time = 0
            efficiency_score = 1.0
            base_productive_hours = 40
            pto_hours_this_week = 0
            holiday_hours_this_week = 0
        },
        @{
            id = "emp2"
            name = "Jane Smith"
            current_load = 0
            skills = @("design")
            role_level = "mid"
            avg_completion_time = 0
            efficiency_score = 1.0
            base_productive_hours = 40
            pto_hours_this_week = 8
            holiday_hours_this_week = 0
        }
    )
}

try {
    Write-Host "POST $uri" -ForegroundColor Yellow
    Write-Host "Sending test data..." -ForegroundColor Gray
    
    $response = Invoke-WebRequest -Uri $uri `
        -Method POST `
        -ContentType "application/json" `
        -Body ($testData | ConvertTo-Json -Depth 10) `
        -ErrorAction Stop

    Write-Host "✓ Response Status: $($response.StatusCode) $($response.StatusDescription)" -ForegroundColor Green
    Write-Host ""
    Write-Host "Response Body:" -ForegroundColor Cyan
    Write-Host ($response.Content | ConvertFrom-Json | ConvertTo-Json -Depth 10) -ForegroundColor White
}
catch [System.Net.Http.HttpRequestException] {
    Write-Host "✗ Connection Failed" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "Troubleshooting:" -ForegroundColor Yellow
    Write-Host "1. Make sure API server is running: npm run api" -ForegroundColor Gray
    Write-Host "2. Check if port 4000 is available: netstat -ano | findstr :4000" -ForegroundColor Gray
    Write-Host "3. Check server.ts for compilation errors" -ForegroundColor Gray
}
catch {
    Write-Host "✗ Request Failed" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Response: $($_.ErrorDetails)" -ForegroundColor Red
}
