const { exec } = require('child_process');
const fs = require('fs');
const https = require('https');

const REPO_URL = 'https://github.com/koyoteh/MAIN-PANTHER-REPO/archive/refs/heads/main.zip';
const TEMP_ZIP = 'panther-core.zip';

console.log('🐾 BLACK PANTHER MD - Downloading core files...');

function downloadWithRedirects(url, dest, redirectCount = 0) {
    return new Promise((resolve, reject) => {
        if (redirectCount > 5) {
            reject(new Error('Too many redirects'));
            return;
        }
        
        https.get(url, (response) => {
            if (response.statusCode === 301 || response.statusCode === 302) {
                console.log('🔄 Following redirect...');
                downloadWithRedirects(response.headers.location, dest, redirectCount + 1)
                    .then(resolve)
                    .catch(reject);
                return;
            }
            
            if (response.statusCode !== 200) {
                reject(new Error(`HTTP ${response.statusCode}`));
                return;
            }
            
            const file = fs.createWriteStream(dest);
            response.pipe(file);
            
            file.on('finish', () => {
                file.close();
                resolve();
            });
            
            file.on('error', reject);
        }).on('error', reject);
    });
}

(async () => {
    try {
        console.log('📥 Downloading from GitHub...');
        await downloadWithRedirects(REPO_URL, TEMP_ZIP);
        
        console.log('📦 Extracting files...');
        exec(`unzip -o ${TEMP_ZIP} && cp -r MAIN-PANTHER-REPO-main/* . && rm -rf MAIN-PANTHER-REPO-main ${TEMP_ZIP}`, (err, stdout, stderr) => {
            if (err) {
                console.error('Extraction failed:', stderr);
                process.exit(1);
            }
            console.log('✅ BLACK PANTHER MD is ready!');
            require('./index.js');
        });
    } catch (err) {
        console.error('Download failed:', err.message);
        process.exit(1);
    }
})();
