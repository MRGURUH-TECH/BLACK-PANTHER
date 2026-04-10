const { exec } = require('child_process');
const fs = require('fs');
const axios = require('axios');
const path = require('path');

const REPO_URL = 'https://github.com/koyoteh/MAIN-PANTHER-REPO/archive/refs/heads/main.zip';
const TEMP_ZIP = 'panther-core.zip';

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

function findIndexJs(dir) {
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isFile() && (item === 'index.js' || item === 'main.js')) {
            return fullPath;
        } else if (stat.isDirectory()) {
            const found = findIndexJs(fullPath);
            if (found) return found;
        }
    }
    return null;
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
        
        // Find extracted directory
        const extractedDir = fs.readdirSync('.').find(d => d.startsWith('MAIN-PANTHER-REPO-main'));
        
        if (!extractedDir) {
            throw new Error('Could not find extracted directory');
        }
        
        console.log(`📁 Moving files from ${extractedDir}...`);
        
        // Move everything up
        const files = fs.readdirSync(extractedDir);
        for (const file of files) {
            const source = path.join(extractedDir, file);
            const dest = path.join('.', file);
            
            if (fs.existsSync(dest)) {
                fs.rmSync(dest, { recursive: true, force: true });
            }
            fs.renameSync(source, dest);
        }
        fs.rmdirSync(extractedDir);
        fs.unlinkSync(TEMP_ZIP);
        
        // Find and run index.js
        const indexFile = findIndexJs('.');
        if (indexFile) {
            console.log(`✅ Found bot entry: ${indexFile}`);
            require(path.resolve(indexFile));
        } else {
            console.error('❌ Could not find index.js or main.js');
            console.log('Available files:', fs.readdirSync('.'));
        }
        
    } catch (err) {
        console.error('Error:', err.message);
        process.exit(1);
    }
}

main();
