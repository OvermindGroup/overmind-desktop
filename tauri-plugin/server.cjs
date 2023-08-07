const { spawn } = require('child_process');

module.exports = {
  startServer() {
    const serverProcess = spawn('node', ['server/app.js'], {
      stdio: 'inherit',
      shell: true,
    });

    process.on('exit', () => {
      serverProcess.kill();
    });
  },
};
