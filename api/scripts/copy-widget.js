import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const source = path.join(__dirname, '../../widget/dist/fahimo-loader.iife.js');
const destDir = path.join(__dirname, '../public');
const dest = path.join(destDir, 'fahimo-widget.js');

if (!fs.existsSync(destDir)){
    fs.mkdirSync(destDir, { recursive: true });
}

try {
    if (fs.existsSync(source)) {
        fs.copyFileSync(source, dest);
        console.log('✅ Widget built and copied to api/public/fahimo-widget.js');
    } else {
        console.error('❌ Widget build artifact not found at:', source);
        process.exit(1);
    }
} catch (err) {
    console.error('❌ Error copying widget:', err);
    process.exit(1);
}
