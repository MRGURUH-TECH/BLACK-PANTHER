const { exec } = require('child_process');
const fs = require('fs');
const axios = require('axios');
const path = require('path');

const REPO_URL = 'https://github.com/koyoteh/MAIN-PANTHER-REPO/archive/refs/heads/main.zip';
const TEMP_ZIP = 'panther-core.zip';
const EXTRACT_DIR = 'MAIN-PANTHER-REPO-main';

console.log('🐾 BLACK PANTHER MD - Downloading core files...');

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

async function main() {
    try {
        console.log('📥 Downloading from GitHub...');
        await downloadFile(REPO_URL, TEMP_ZIP);
        
        console.log('📦 Extracting files...');
        
        // Extract zip
        await new Promise((resolve, reject) => {
            exec(`unzip -o ${TEMP_ZIP}`, (err, stdout, stderr) => {
                if (err) reject(err);
                else resolve();
            });
        });
        
        // Move files from subfolder to current directory
        if (fs.existsSync(EXTRACT_DIR)) {
            const files = fs.readdirSync(EXTRACT_DIR);
            for (const file of files) {
                const source = path.join(EXTRACT_DIR, file);
                const dest = path.join('.', file);
                if (fs.existsSync(dest)) {
                    fs.rmSync(dest, { recursive: true, force: true });
                }
                fs.renameSync(source, dest);
            }
            fs.rmdirSync(EXTRACT_DIR);
        }
        
        // Clean up
        fs.unlinkSync(TEMP_ZIP);
        
        console.log('✅ BLACK PANTHER MD is ready! Starting bot...');
        require('./index.js');
        
    } catch (err) {
        console.error('Error:', err.message);
        process.exit(1);
    }
}

main();
