# Publish this branch to GitHub (fixes "branch already exists" when remote has initial README).
# Usage: .\publish.ps1 [repo-url]
# Example: .\publish.ps1 https://github.com/goran173/compliance-cloud-hub.git

param(
    [Parameter(Mandatory = $false)]
    [string]$RepoUrl
)

if (-not $RepoUrl) {
    Write-Host "Usage: .\publish.ps1 <repo-url>" -ForegroundColor Yellow
    Write-Host "Example: .\publish.ps1 https://github.com/goran173/compliance-cloud-hub.git" -ForegroundColor Gray
    exit 1
}

$remoteExists = git remote get-url origin 2>$null
if ($LASTEXITCODE -ne 0) {
    git remote add origin $RepoUrl
} else {
    git remote set-url origin $RepoUrl
}

git push -u origin main --force
