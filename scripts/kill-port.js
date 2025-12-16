// Auto-kill process on port 3001 before starting server
const { exec } = require('child_process');
const PORT = process.env.PORT || 3001;

console.log(`🔍 Checking port ${PORT}...`);

exec(`netstat -ano | findstr :${PORT}`, (error, stdout) => {
  if (stdout) {
    const lines = stdout.trim().split('\n');
    const pids = new Set();
    
    lines.forEach((line) => {
      const match = line.match(/LISTENING\s+(\d+)/);
      if (match) {
        pids.add(match[1]);
      }
    });
    
    if (pids.size > 0) {
      console.log(`🔪 Found ${pids.size} process(es) on port ${PORT}, killing...`);
      
      pids.forEach((pid) => {
        exec(`taskkill /F /PID ${pid}`, (killError) => {
          if (!killError) {
            console.log(`✅ Process ${pid} killed`);
          }
        });
      });
      
      // Wait a bit for processes to die
      setTimeout(() => {
        console.log(`✅ Port ${PORT} is now free`);
      }, 500);
    } else {
      console.log(`✅ Port ${PORT} is already free`);
    }
  } else {
    console.log(`✅ Port ${PORT} is already free`);
  }
});

