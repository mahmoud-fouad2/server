import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const source = path.join(__dirname, '../../widget/dist/fahimo-loader.iife.js');
const destDir = path.join(__dirname, '../public');
const dest = path.join(destDir, 'fahimo-widget.js');

// Sound files source and destination
const soundsSource = path.join(__dirname, '../../widget/public/sounds');
const soundsDest = path.join(destDir, 'sounds');

if (!fs.existsSync(destDir)){
    fs.mkdirSync(destDir, { recursive: true });
}

try {
    // Copy widget JS
    if (fs.existsSync(source)) {
        fs.copyFileSync(source, dest);
        console.log('✅ Widget built and copied to api/public/fahimo-widget.js');
    } else {
        console.error('❌ Widget build artifact not found at:', source);
        process.exit(1);
    }

    // Copy sounds folder
    if (fs.existsSync(soundsSource)) {
        if (!fs.existsSync(soundsDest)) {
            fs.mkdirSync(soundsDest, { recursive: true });
        }
        const soundFiles = fs.readdirSync(soundsSource);
        soundFiles.forEach(file => {
            fs.copyFileSync(
                path.join(soundsSource, file),
                path.join(soundsDest, file)
            );
        });
        console.log('✅ Sound files copied to api/public/sounds/');
    } else {
        console.warn('⚠️ No sound files found at:', soundsSource);
    }
} catch (err) {
    console.error('❌ Error copying widget:', err);
    process.exit(1);
}
