const { exec } = require('child_process');
const fs = require('fs');
const https = require('https');
const axios = require('axios');

const REPO_URL = 'https://github.com/koyoteh/MAIN-PANTHER-REPO/archive/refs/heads/main.zip';
const TEMP_ZIP = 'panther-core.zip';

console.log('🐾 BLACK PANTHER MD - Downloading core files...');

async function downloadFile(url, dest) {
    try {
        const response = await axios({
            method: 'GET',
            url: url,
            responseType: 'stream',
            maxRedirects: 5,
            validateStatus: false
        });
        
        if (response.status === 302 || response.status === 301) {
            console.log('🔄 Following redirect...');
            return downloadFile(response.headers.location, dest);
        }
        
        if (response.status !== 200) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const writer = fs.createWriteStream(dest);
        response.data.pipe(writer);
        
        return new Promise((resolve, reject) => {
            writer.on('finish', resolve);
            writer.on('error', reject);
        });
    } catch (error) {
        throw new Error(`Download failed: ${error.message}`);
    }
}

(async () => {
    try {
        console.log('📥 Downloading from GitHub...');
        await downloadFile(REPO_URL, TEMP_ZIP);
        
        console.log('📦 Extracting files...');
        exec(`unzip -o ${TEMP_ZIP} && cp -r MAIN-PANTHER-REPO-main/* . && rm -rf MAIN-PANTHER-REPO-main ${TEMP_ZIP}`, (err, stdout, stderr) => {
            if (err) {
                console.error('Extraction failed:', stderr);
                process.exit(1);
            }
            console.log('✅ BLACK PANTHER MD is ready! Starting bot...');
            require('./index.js');
        });
    } catch (err) {
        console.error('Error:', err.message);
        process.exit(1);
    }
})();
