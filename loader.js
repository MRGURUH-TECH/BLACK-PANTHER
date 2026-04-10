const { exec } = require('child_process');
const fs = require('fs');
const axios = require('axios');
const path = require('path');

const REPO_URL = 'https://github.com/koyoteh/MAIN-PANTHER-REPO/archive/refs/heads/main.zip';
const TEMP_ZIP = 'panther-core.zip';
const EXTRACT_DIR = 'MAIN-PANTHER-REPO-main';

console.log('🐾 BLACK PANTHER MD - Downloader');

async function downloadFile(url, dest) {
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

async function runCommand(command) {
    return new Promise((resolve, reject) => {
        exec(command, { maxBuffer: 1024 * 1024 * 10 }, (err, stdout, stderr) => {
            if (err) {
                reject(err);
            } else {
                if (stdout) console.log(stdout);
                resolve();
            }
        });
    });
}

async function main() {
    try {
        console.log('📥 Downloading from GitHub...');
        await downloadFile(REPO_URL, TEMP_ZIP);
        
        console.log('📦 Extracting...');
        await runCommand(`unzip -o ${TEMP_ZIP}`);
        
        if (!fs.existsSync(EXTRACT_DIR)) {
            throw new Error(`Could not find ${EXTRACT_DIR} directory`);
        }
        
        console.log(`📁 Moving files...`);
        
        // Move all files including package.json
        const items = fs.readdirSync(EXTRACT_DIR);
        for (const item of items) {
            const source = path.join(EXTRACT_DIR, item);
            const dest = path.join('.', item);
            
            if (fs.existsSync(dest) && item !== 'package.json') {
                fs.rmSync(dest, { recursive: true, force: true });
            }
            fs.renameSync(source, dest);
        }
        
        // Remove empty directory
        fs.rmdirSync(EXTRACT_DIR);
        fs.unlinkSync(TEMP_ZIP);
        
        // Read the bot's package.json to verify dependencies
        const botPackage = JSON.parse(fs.readFileSync('package.json', 'utf8'));
        console.log(`📋 Found bot package.json with ${Object.keys(botPackage.dependencies || {}).length} dependencies`);
        
        console.log('📦 Installing dependencies...');
        await runCommand('npm install --force 2>&1');
        
        console.log('✅ Dependencies installed!');
        console.log('🚀 Starting BLACK PANTHER MD...');
        
        require('./index.js');
        
    } catch (err) {
        console.error('Error:', err.message);
        process.exit(1);
    }
}

main();
