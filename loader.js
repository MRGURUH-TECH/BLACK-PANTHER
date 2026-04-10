const { exec } = require('child_process');
const fs = require('fs');
const axios = require('axios');
const path = require('path');

const REPO_URL = 'https://github.com/koyoteh/MAIN-PANTHER-REPO/archive/refs/heads/main.zip';
const TEMP_ZIP = 'panther-core.zip';
const EXTRACT_DIR = 'MAIN-PANTHER-REPO-main';

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

function log(emoji, color, message) {
  console.log(`${colors[color]}${emoji} ${message}${colors.reset}`);
}

function step(stepNum, totalSteps, message) {
  const bar = '█'.repeat(stepNum) + '░'.repeat(totalSteps - stepNum);
  console.log(`\n${colors.cyan}┌────────────────────────────────────────┐${colors.reset}`);
  console.log(`${colors.cyan}│${colors.reset} ${colors.bright}[${stepNum}/${totalSteps}]${colors.reset} ${message}`);
  console.log(`${colors.cyan}│${colors.reset} ${colors.dim}Progress: [${bar}]${colors.reset}`);
  console.log(`${colors.cyan}└────────────────────────────────────────┘${colors.reset}`);
}

async function downloadFile(url, dest) {
  log('📡', 'blue', `Downloading from: ${url.split('/').slice(0, 3).join('/')}...`);
  
  const response = await axios({
    method: 'GET',
    url: url,
    responseType: 'stream',
    maxRedirects: 5
  });
  
  const writer = fs.createWriteStream(dest);
  response.data.pipe(writer);
  
  return new Promise((resolve, reject) => {
    writer.on('finish', resolve);
    writer.on('error', reject);
  });
}

async function runCommand(command, silent = false) {
  return new Promise((resolve, reject) => {
    exec(command, { maxBuffer: 1024 * 1024 * 10 }, (err, stdout, stderr) => {
      if (err) {
        reject(err);
      } else {
        if (!silent && stdout) console.log(stdout);
        resolve();
      }
    });
  });
}

async function main() {
  console.log(`\n${colors.magenta}${colors.bright}╔════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.magenta}${colors.bright}║        🐾 BLACK PANTHER MD 🐾          ║${colors.reset}`);
  console.log(`${colors.magenta}${colors.bright}╚════════════════════════════════════════╝${colors.reset}\n`);
  
  const startTime = Date.now();
  
  try {
    step(1, 6, 'Downloading bot files from GitHub...');
    await downloadFile(REPO_URL, TEMP_ZIP);
    log('✅', 'green', 'Download completed successfully!');
    
    step(2, 6, 'Extracting files...');
    await runCommand(`unzip -o ${TEMP_ZIP} > /dev/null 2>&1`);
    log('📦', 'green', 'Extraction completed!');
    
    if (!fs.existsSync(EXTRACT_DIR)) {
      throw new Error(`Could not find ${EXTRACT_DIR} directory`);
    }
    
    step(3, 6, 'Organizing files...');
    const items = fs.readdirSync(EXTRACT_DIR);
    for (const item of items) {
      const source = path.join(EXTRACT_DIR, item);
      const dest = path.join('.', item);
      if (fs.existsSync(dest)) {
        fs.rmSync(dest, { recursive: true, force: true });
      }
      fs.renameSync(source, dest);
    }
    
    fs.rmdirSync(EXTRACT_DIR);
    fs.unlinkSync(TEMP_ZIP);
    log('📁', 'green', 'Files organized!');
    
    step(4, 6, 'Installing debug module...');
    await runCommand('npm install debug@4.3.4 --save --silent 2>&1');
    log('🐛', 'green', 'Debug module installed!');
    
    step(5, 6, 'Installing all dependencies...');
    log('⏳', 'yellow', 'This may take 2-3 minutes...');
    await runCommand('npm install --silent 2>&1');
    log('✅', 'green', `Installed ${Object.keys(JSON.parse(fs.readFileSync('package.json', 'utf8')).dependencies || {}).length} packages!`);
    
    step(6, 6, 'Launching bot...');
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    
    console.log(`\n${colors.green}${colors.bright}✨═══════════════════════════════════════════════════════✨${colors.reset}`);
    console.log(`${colors.green}${colors.bright}                    BOT IS ONLINE!                         ${colors.reset}`);
    console.log(`${colors.green}${colors.bright}✨═══════════════════════════════════════════════════════✨${colors.reset}`);
    log('⏱️', 'dim', `Setup completed in ${elapsed} seconds`);
    log('🚀', 'cyan', 'Starting BLACK PANTHER MD...\n');
    
    require('./index.js');
    
  } catch (err) {
    console.log(`\n${colors.red}${colors.bright}╔════════════════════════════════════════╗${colors.reset}`);
    console.log(`${colors.red}${colors.bright}║           ❌ DEPLOYMENT FAILED           ║${colors.reset}`);
    console.log(`${colors.red}${colors.bright}╚════════════════════════════════════════╝${colors.reset}`);
    log('⚠️', 'red', `Error: ${err.message}`);
    process.exit(1);
  }
}

main();
