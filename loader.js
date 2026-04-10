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

async function main() {
    try {
        console.log('📥 Downloading from GitHub...');
        await downloadFile(REPO_URL, TEMP_ZIP);
        
        console.log('📦 Extracting...');
        await new Promise((resolve, reject) => {
            exec(`unzip -o ${TEMP_ZIP}`, (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
        
        // Check if extraction directory exists
        if (!fs.existsSync(EXTRACT_DIR)) {
            throw new Error(`Could not find ${EXTRACT_DIR} directory`);
        }
        
        console.log(`📁 Moving files from ${EXTRACT_DIR}...`);
        
        // Move all files and folders up
        const items = fs.readdirSync(EXTRACT_DIR);
        for (const item of items) {
            const source = path.join(EXTRACT_DIR, item);
            const dest = path.join('.', item);
            
            if (fs.existsSync(dest)) {
                fs.rmSync(dest, { recursive: true, force: true });
            }
            fs.renameSync(source, dest);
        }
        
        // Remove empty directory and zip
        fs.rmdirSync(EXTRACT_DIR);
        fs.unlinkSync(TEMP_ZIP);
        
        // Look for index.js in the current directory (not system paths)
        if (fs.existsSync('./index.js')) {
            console.log('✅ Found bot entry: index.js');
            require('./index.js');
        } else if (fs.existsSync('./main.js')) {
            console.log('✅ Found bot entry: main.js');
            require('./main.js');
        } else if (fs.existsSync('./guru/index.js')) {
            console.log('✅ Found bot entry: guru/index.js');
            require('./guru/index.js');
        } else {
            console.error('❌ Could not find index.js or main.js');
            console.log('📂 Files in current directory:', fs.readdirSync('.').filter(f => !f.startsWith('.')));
            process.exit(1);
        }
        
    } catch (err) {
        console.error('Error:', err.message);
        process.exit(1);
    }
}

main();
