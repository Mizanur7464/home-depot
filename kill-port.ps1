# Kill process on port 3001
$port = 3001
$processes = netstat -ano | findstr ":$port" | findstr "LISTENING"

if ($processes) {
    $processes | ForEach-Object {
        $parts = $_ -split '\s+'
        $pid = $parts[-1]
        if ($pid -match '^\d+$') {
            Write-Host "Killing process $pid on port $port..."
            taskkill /F /PID $pid 2>$null
        }
    }
    Write-Host "✅ Port $port is now free"
} else {
    Write-Host "✅ Port $port is already free"
}

