const { spawn } = require('child_process');

// Run vite dev server
const vite = spawn('npm', ['run', 'dev', '--', '--host', '0.0.0.0', '--port', '8800'], {
  stdio: 'inherit',
  shell: true,
  windowsHide: true
});

vite.on('error', (error) => {
  console.error(`Failed to start Vite: ${error}`);
  process.exit(1);
});

vite.on('close', (code) => {
  console.log(`Vite process exited with code ${code}`);
  process.exit(code);
});

// Handle process termination
process.on('SIGTERM', () => {
  vite.kill('SIGTERM');
});

process.on('SIGINT', () => {
  vite.kill('SIGINT');
});
