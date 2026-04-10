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
                console.error('Command error:', err.message);
                reject(err);
            } else {
                if (stdout) console.log(stdout);
                if (stderr) console.error(stderr);
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
        
        console.log(`📁 Moving files from ${EXTRACT_DIR}...`);
        
        // Save the loader's package.json temporarily
        const loaderPackageJson = fs.readFileSync('package.json', 'utf8');
        
        const items = fs.readdirSync(EXTRACT_DIR);
        for (const item of items) {
            const source = path.join(EXTRACT_DIR, item);
            const dest = path.join('.', item);
            
            // Skip if it's the loader's package.json
            if (item === 'package.json') {
                console.log('📦 Preserving bot package.json');
                continue;
            }
            
            if (fs.existsSync(dest)) {
                fs.rmSync(dest, { recursive: true, force: true });
            }
            fs.renameSync(source, dest);
        }
        
        // Restore loader package.json but keep bot's dependencies
        const botPackageJson = JSON.parse(fs.readFileSync(path.join(EXTRACT_DIR, 'package.json'), 'utf8'));
        const loaderPackage = JSON.parse(loaderPackageJson);
        
        // Merge dependencies
        const mergedPackage = {
            ...botPackageJson,
            scripts: {
                ...botPackageJson.scripts,
                start: "node loader.js"
            },
            dependencies: {
                ...botPackageJson.dependencies,
                ...loaderPackage.dependencies
            }
        };
        
        fs.writeFileSync('package.json', JSON.stringify(mergedPackage, null, 2));
        
        fs.rmdirSync(EXTRACT_DIR);
        fs.unlinkSync(TEMP_ZIP);
        
        console.log('📦 Installing dependencies...');
        await runCommand('npm install --force');
        
        console.log('✅ Dependencies installed!');
        
        if (fs.existsSync('./index.js')) {
            console.log('🚀 Starting BLACK PANTHER MD...');
            require('./index.js');
        } else {
            console.error('❌ Could not find index.js');
            process.exit(1);
        }
        
    } catch (err) {
        console.error('Error:', err.message);
        process.exit(1);
    }
}

main();
