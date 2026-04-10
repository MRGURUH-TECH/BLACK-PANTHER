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
    console.log('📡 Downloading from GitHub...');
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
        exec(command, (err, stdout, stderr) => {
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
        console.log('[1/7] Downloading...');
        await downloadFile(REPO_URL, TEMP_ZIP);
        console.log('✅ Download complete');
        
        console.log('[2/7] Extracting...');
        await runCommand(`unzip -o ${TEMP_ZIP}`);
        console.log('✅ Extract complete');
        
        if (!fs.existsSync(EXTRACT_DIR)) {
            throw new Error('Extraction directory not found');
        }
        
        console.log('[3/7] Moving files...');
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
        console.log('✅ Files moved');
        
        console.log('[4/7] Installing debug first...');
        await runCommand('npm install debug@4.3.4 --save --force');
        console.log('✅ debug installed');
        
        console.log('[5/7] Installing remaining dependencies...');
        console.log('⏳ This may take 2-3 minutes...');
        await runCommand('npm install --force');
        console.log('✅ All dependencies installed');
        
        console.log('[6/7] Verifying debug module...');
        try {
            require.resolve('debug');
            console.log('✅ debug module verified');
        } catch (e) {
            console.log('⚠️ debug not found, installing again...');
            await runCommand('npm install debug@4.3.4 --save --force');
        }
        
        console.log('[7/7] Starting bot...');
        console.log('\n════════════════════════════════════════');
        console.log('      🚀 BOT IS ONLINE! 🚀          ');
        console.log('════════════════════════════════════════\n');
        
        require('./index.js');
        
    } catch (err) {
        console.error('❌ Error:', err.message);
        process.exit(1);
    }
}

main();
