const fs = require('fs');
const path = require('path');

// Simple icon generation using canvas or sharp
async function generateIcons() {
  try {
    // Try using sharp if available
    const sharp = require('sharp');
    
    const publicDir = path.join(__dirname, 'client', 'public');
    
    // Create a simple SVG as buffer
    const svgBuffer = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
      <circle cx="256" cy="256" r="256" fill="#f97316"/>
      <circle cx="256" cy="256" r="200" fill="#fde047"/>
      <circle cx="256" cy="180" r="70" fill="#fff7ed" stroke="#f97316" stroke-width="6"/>
      <circle cx="150" cy="320" r="70" fill="#fff7ed" stroke="#f97316" stroke-width="6"/>
      <circle cx="362" cy="320" r="70" fill="#fff7ed" stroke="#f97316" stroke-width="6"/>
    </svg>`);
    
    // Generate 192x192
    await sharp(svgBuffer)
      .png()
      .resize(192, 192)
      .toFile(path.join(publicDir, 'icon-192.png'));
    console.log('✅ Created icon-192.png');
    
    // Generate 512x512
    await sharp(svgBuffer)
      .png()
      .resize(512, 512)
      .toFile(path.join(publicDir, 'icon-512.png'));
    console.log('✅ Created icon-512.png');
    
    // Generate maskable versions (add safe area)
    await sharp(svgBuffer)
      .png()
      .resize(192, 192, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .toFile(path.join(publicDir, 'icon-192-maskable.png'));
    console.log('✅ Created icon-192-maskable.png');
    
    await sharp(svgBuffer)
      .png()
      .resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .toFile(path.join(publicDir, 'icon-512-maskable.png'));
    console.log('✅ Created icon-512-maskable.png');
    
  } catch (error) {
    if (error.code === 'MODULE_NOT_FOUND') {
      console.log('⚠️  sharp not installed, creating placeholder PNG files instead...');
      createPlaceholderIcons();
    } else {
      console.error('Error:', error);
      createPlaceholderIcons();
    }
  }
}

function createPlaceholderIcons() {
  const publicDir = path.join(__dirname, 'client', 'public');
  
  // Create minimal valid PNG files (1x1 pixel orange)
  const pngHeader = Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, // PNG signature
    0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52, // IHDR chunk
    0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, // 1x1 dimensions
    0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, // 8-bit RGB
    0xde, // CRC
    0x00, 0x00, 0x00, 0x0c, 0x49, 0x44, 0x41, 0x54, // IDAT chunk
    0x08, 0x99, 0x01, 0x01, 0x00, 0x00, 0xfe, 0xff, // Compressed data
    0xf9, 0x73, 0x16, 0x00, 0x00, 0x04, 0x26, 0xcd, // Orange color #f97316
    0xe3, 0xc5, // CRC
    0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, // IEND chunk
    0xae, 0x42, 0x60, 0x82 // CRC
  ]);
  
  const sizes = [192, 512];
  const variants = ['', '-maskable'];
  
  for (const size of sizes) {
    for (const variant of variants) {
      const filename = `icon-${size}${variant}.png`;
      const filepath = path.join(publicDir, filename);
      fs.writeFileSync(filepath, pngHeader);
      console.log(`✅ Created placeholder ${filename}`);
    }
  }
}

generateIcons();
