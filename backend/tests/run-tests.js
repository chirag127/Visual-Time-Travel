/**
 * Test runner script
 * Runs all tests in the tests directory
 */

const { spawn } = require('child_process');
const path = require('path');

// Set environment variables for testing
process.env.NODE_ENV = 'test';
process.env.MONGODB_URI = 'mongodb://localhost:27017/visual-time-travel-test';
process.env.JWT_SECRET = 'test_jwt_secret';
process.env.PORT = 5001;

// Run tests
const mochaProcess = spawn('npx', ['mocha', '--timeout', '10000', 'tests/**/*.test.js'], {
  stdio: 'inherit',
  shell: true,
  cwd: path.resolve(__dirname, '..')
});

mochaProcess.on('exit', (code) => {
  process.exit(code);
});
