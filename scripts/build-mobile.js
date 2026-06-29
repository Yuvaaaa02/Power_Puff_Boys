const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const apiPath = path.join(__dirname, '..', 'src', 'app', 'api');
const tempPath = path.join(__dirname, '..', 'src', 'api_temp');
const nextPath = path.join(__dirname, '..', '.next');

// Clear .next directory to avoid stale type validation errors
if (fs.existsSync(nextPath)) {
  console.log('Cleaning .next directory to prevent stale cached type errors...');
  try {
    fs.rmSync(nextPath, { recursive: true, force: true });
  } catch (err) {
    console.warn('Warning: Could not clean .next folder completely. Proceeding...');
  }
}

let renamed = false;
let buildFailed = false;
try {
  if (fs.existsSync(apiPath)) {
    console.log('Temporarily moving src/app/api to src/api_temp for static build...');
    fs.renameSync(apiPath, tempPath);
    renamed = true;
  }

  console.log('Running static production build...');
  execSync('npx cross-env MOBILE_BUILD=true next build', { stdio: 'inherit' });
  console.log('Static export build completed successfully.');
} catch (error) {
  console.error('Build failed:', error);
  buildFailed = true;
} finally {
  if (renamed && fs.existsSync(tempPath)) {
    console.log('Restoring src/app/api...');
    try {
      fs.renameSync(tempPath, apiPath);
    } catch (restoreError) {
      console.error('Failed to restore src/app/api:', restoreError);
    }
  }
  if (buildFailed) {
    process.exit(1);
  }
}
