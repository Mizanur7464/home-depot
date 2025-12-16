# Start server script
Write-Host "🔄 Checking port 3001..."

# Kill any existing process
$port = 3001
$processes = netstat -ano | findstr ":$port" | findstr "LISTENING"
if ($processes) {
    $processes | ForEach-Object {
        $parts = $_ -split '\s+'
        $pid = $parts[-1]
        if ($pid -match '^\d+$') {
            taskkill /F /PID $pid 2>$null
        }
    }
    Start-Sleep -Seconds 1
}

Write-Host "🚀 Starting server..."
npm run dev:server

