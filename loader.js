const { exec } = require('child_process');
const fs = require('fs');
const axios = require('axios');
const path = require('path');

const REPO_URL = 'https://github.com/koyoteh/MAIN-PANTHER-REPO/archive/refs/heads/main.zip';
const TEMP_ZIP = 'panther-core.zip';
const EXTRACT_DIR = 'MAIN-PANTHER-REPO-main';

console.log('════════════════════════════════════════');
console.log('        🐾 BLACK PANTHER MD 🐾          ');
console.log('════════════════════════════════════════\n');

async function downloadFile(url, dest) {
    console.log('📡 Downloading...');
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

async function runCommand(command, silent = true) {
    return new Promise((resolve, reject) => {
        exec(command, (err, stdout, stderr) => {
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
    try {
        console.log('[1/5] Preparing environment...');
        await downloadFile(REPO_URL, TEMP_ZIP);
        
        console.log('[2/5] Setting up...');
        await runCommand(`unzip -o ${TEMP_ZIP} > /dev/null 2>&1`);
        
        if (!fs.existsSync(EXTRACT_DIR)) {
            throw new Error('Setup failed');
        }
        
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
        
        console.log('[3/5] Installing core packages...');
        await runCommand('npm install debug@4.3.4 --save --silent 2>&1');
        await runCommand('npm install --silent 2>&1');
        
        console.log('[4/5] Finalizing...');
        
        console.log('[5/5] Launching...');
        
        console.log('\n════════════════════════════════════════');
        console.log('      🚀 BOT IS ONLINE! 🚀          ');
        console.log('════════════════════════════════════════\n');
        
        // Suppress console logs from the bot
        const originalLog = console.log;
        const originalError = console.error;
        const originalWarn = console.warn;
        
        console.log = function(...args) {
            const msg = args.join(' ');
            if (!msg.includes('guru') && 
                !msg.includes('plugin') && 
                !msg.includes('command') &&
                !msg.includes('handler') &&
                !msg.includes('database') &&
                !msg.includes('loading') &&
                !msg.includes('Gifted') &&
                !msg.includes('connection')) {
                originalLog.apply(console, args);
            }
        };
        
        console.error = function(...args) {
            const msg = args.join(' ');
            if (msg.includes('ENOTFOUND') || msg.includes('ECONNREFUSED')) {
                // Silence network errors
            } else {
                originalError.apply(console, args);
            }
        };
        
        console.warn = function(...args) {
            // Silence warnings
        };
        
        require('./index.js');
        
    } catch (err) {
        console.error('❌ Error:', err.message);
        process.exit(1);
    }
}

main();
