const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔄 Restarting Next.js server...');

// Function to execute shell commands
function executeCommand(command) {
  return new Promise((resolve, reject) => {
    console.log(`Running: ${command}`);
    
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error: ${error.message}`);
        return reject(error);
      }
      
      if (stderr) {
        console.log(`stderr: ${stderr}`);
      }
      
      console.log(`stdout: ${stdout}`);
      resolve(stdout);
    });
  });
}

// Function to delete a directory
function deleteDirectory(directory) {
  return new Promise((resolve, reject) => {
    if (fs.existsSync(directory)) {
      console.log(`Deleting ${directory}...`);
      
      fs.rm(directory, { recursive: true, force: true }, (err) => {
        if (err) {
          console.error(`Error deleting ${directory}: ${err.message}`);
          return reject(err);
        }
        
        console.log(`Successfully deleted ${directory}`);
        resolve();
      });
    } else {
      console.log(`${directory} does not exist. Skipping.`);
      resolve();
    }
  });
}

// Main function to restart the server
async function restartServer() {
  try {
    // Kill any running Next.js processes
    const isWindows = process.platform === 'win32';
    if (isWindows) {
      try {
        await executeCommand('taskkill /F /IM node.exe');
      } catch {
        console.log('No Node.js processes to kill or unable to kill them.');
      }
    } else {
      try {
        await executeCommand('pkill -f "next"');
      } catch {
        console.log('No Next.js processes to kill or unable to kill them.');
      }
    }

    // Delete Next.js cache
    await deleteDirectory(path.join(__dirname, '.next'));
    
    // Delete Node modules cache
    await deleteDirectory(path.join(__dirname, 'node_modules/.cache'));
    
    // Start the development server
    console.log('Starting Next.js development server...');
    await executeCommand('npm run dev');
    
  } catch (error) {
    console.error('Error during restart:', error);
    process.exit(1);
  }
}

// Run the main function
restartServer(); 