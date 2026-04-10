const { exec } = require('child_process');
const fs = require('fs');
const https = require('https');
const path = require('path');

const REPO_URL = 'https://github.com/koyoteh/MAIN-PANTHER-REPO/archive/refs/heads/main.zip';
const TEMP_ZIP = 'panther-core.zip';

console.log('🐾 BLACK PANTHER MD - Downloading core files...');
console.log('📥 Downloading from:', REPO_URL);

const download = (url, dest) => {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(dest);
        https.get(url, (response) => {
            if (response.statusCode !== 200) {
                reject(new Error(`Failed to download: ${response.statusCode}`));
                return;
            }
            response.pipe(file);
            file.on('finish', () => {
                file.close();
                resolve();
            });
        }).on('error', (err) => {
            fs.unlink(dest, () => {});
            reject(err);
        });
    });
};

(async () => {
    try {
        await download(REPO_URL, TEMP_ZIP);
        console.log('📦 Extracting core files...');
        
        // Check if zip file exists and is valid
        if (!fs.existsSync(TEMP_ZIP)) {
            throw new Error('Download failed: Zip file not found');
        }
        
        exec(`unzip -o ${TEMP_ZIP} && cp -r MAIN-PANTHER-REPO-main/* . && rm -rf MAIN-PANTHER-REPO-main ${TEMP_ZIP}`, (err, stdout, stderr) => {
            if (err) {
                console.error('Extraction error:', stderr);
                throw err;
            }
            console.log('✅ BLACK PANTHER MD is ready!');
            
            // Check if index.js exists
            if (fs.existsSync('./index.js')) {
                require('./index.js');
            } else {
                console.error('Error: index.js not found after extraction');
            }
        });
    } catch (err) {
        console.error('Download failed:', err.message);
        console.log('🔄 Retrying in 5 seconds...');
        setTimeout(() => {
            process.exit(1);
        }, 5000);
    }
})();
