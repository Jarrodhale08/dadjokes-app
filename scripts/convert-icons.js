/**
 * Convert SVG icons to PNG
 * Run: node scripts/convert-icons.js
 */

const fs = require('fs');
const path = require('path');

async function convertIcons() {
  let sharp;
  try {
    sharp = require('sharp');
  } catch (e) {
    console.error('Sharp not installed. Run: npm install sharp --save-dev');
    console.log('\nAlternatively, convert SVG files manually using:');
    console.log('- https://svgtopng.com/');
    console.log('- https://cloudconvert.com/svg-to-png');
    console.log('\nSVG files are in: assets/images/');
    return;
  }

  const assetsDir = path.join(__dirname, '..', 'assets', 'images');

  const conversions = [
    { svg: 'icon.svg', png: 'icon.png', size: 1024 },
    { svg: 'adaptive-icon.svg', png: 'adaptive-icon.png', size: 1024 },
    { svg: 'splash.svg', png: 'splash.png', width: 1284, height: 2778 },
    { svg: 'favicon.svg', png: 'favicon.png', size: 48 },
  ];

  for (const conv of conversions) {
    const svgPath = path.join(assetsDir, conv.svg);
    const pngPath = path.join(assetsDir, conv.png);

    if (!fs.existsSync(svgPath)) {
      console.log(`Skipping ${conv.svg} - file not found`);
      continue;
    }

    try {
      let pipeline = sharp(svgPath);

      if (conv.width && conv.height) {
        pipeline = pipeline.resize(conv.width, conv.height);
      } else if (conv.size) {
        pipeline = pipeline.resize(conv.size, conv.size);
      }

      await pipeline.png().toFile(pngPath);
      console.log(`Converted: ${conv.svg} -> ${conv.png}`);
    } catch (err) {
      console.error(`Failed to convert ${conv.svg}:`, err.message);
    }
  }

  console.log('\nDone! PNG icons are ready in assets/images/');
}

convertIcons();
