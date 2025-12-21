import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Allow overriding paths via environment variables for CI/CD flexibility
const WIDGET_DIR = process.env.WIDGET_DIR || path.resolve(__dirname, '../../widget');
const API_PUBLIC_DIR = process.env.API_PUBLIC_DIR || path.resolve(__dirname, '../public');

const sourceFile = path.join(WIDGET_DIR, 'dist/fahimo-loader.iife.js');
const destFile = path.join(API_PUBLIC_DIR, 'fahimo-widget.js');

const soundsSource = path.join(WIDGET_DIR, 'public/sounds');
const soundsDest = path.join(API_PUBLIC_DIR, 'sounds');

console.log(`📦 Starting Widget Copy Process...`);
console.log(`   Source: ${WIDGET_DIR}`);
console.log(`   Dest:   ${API_PUBLIC_DIR}`);

// Ensure destination exists
if (!fs.existsSync(API_PUBLIC_DIR)) {
    fs.mkdirSync(API_PUBLIC_DIR, { recursive: true });
}

try {
    // 1. Copy Widget JS
    if (fs.existsSync(sourceFile)) {
        fs.copyFileSync(sourceFile, destFile);
        console.log(`✅ Widget JS copied successfully.`);
    } else {
        console.error(`❌ Error: Widget build artifact not found.`);
        console.error(`   Expected at: ${sourceFile}`);
        console.error(`   Did you run 'npm run build' in the widget directory?`);
        process.exit(1);
    }

    // 2. Copy Sounds (Recursive)
    if (fs.existsSync(soundsSource)) {
        // Node.js 16.7.0+ supports cpSync with recursive: true
        if (fs.cpSync) {
            fs.cpSync(soundsSource, soundsDest, { recursive: true, force: true });
        } else {
            // Fallback for older Node versions
            if (!fs.existsSync(soundsDest)) fs.mkdirSync(soundsDest, { recursive: true });
            const files = fs.readdirSync(soundsSource);
            for (const file of files) {
                fs.copyFileSync(path.join(soundsSource, file), path.join(soundsDest, file));
            }
        }
        console.log(`✅ Sound files copied successfully.`);
    } else {
        console.warn(`⚠️ Warning: No sounds directory found at ${soundsSource}`);
    }

    console.log(`🎉 Widget integration complete.`);

} catch (err) {
    console.error('❌ Fatal Error during widget copy:', err);
    process.exit(1);
}
