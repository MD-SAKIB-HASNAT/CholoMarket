# Starts Postgres + Redis (Docker) and opens the API and web app in their own windows.
# First run: installs dependencies, creates tables and loads demo data.
$ErrorActionPreference = "Stop"
$root = $PSScriptRoot

docker compose -f "$root\docker-compose.yml" up -d

if (-not (Test-Path "$root\backend\node_modules")) {
  Push-Location "$root\backend"; npm install; Pop-Location
}
if (-not (Test-Path "$root\frontend\node_modules")) {
  Push-Location "$root\frontend"; npm install; Pop-Location
}
if (-not (Test-Path "$root\backend\.env")) {
  Copy-Item "$root\backend\.env.example" "$root\backend\.env"
}

# Apply any pending migrations (safe to run every time).
Push-Location "$root\backend"; npm run migration:run; Pop-Location

Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\backend'; npm run start:dev"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\frontend'; npm run dev"

Write-Host ""
Write-Host "API:     http://localhost:4000/api   (Swagger: http://localhost:4000/api/docs)"
Write-Host "Web app: http://localhost:3100"
Write-Host "First time? Load demo data with:  cd backend; npm run seed"
