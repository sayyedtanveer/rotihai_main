#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Minimal valid PNG files with orange color #f97316
function createMinimalPNG(size) {
  // This creates a valid 1x1 orange PNG that can be resized
  // PNG header signature
  const header = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  
  // IHDR chunk (image header) - defining dimensions
  const width = Buffer.alloc(4);
  width.writeUInt32BE(1);
  const height = Buffer.alloc(4);
  height.writeUInt32BE(1);
  
  const ihdr = Buffer.concat([
    Buffer.from([0x00, 0x00, 0x00, 0x0d]), // chunk length
    Buffer.from('IHDR'),
    width,
    height,
    Buffer.from([0x08, 0x02, 0x00, 0x00, 0x00]), // 8-bit RGB
    Buffer.from([0x90, 0x77, 0x53, 0xde]) // CRC
  ]);
  
  // IDAT chunk (image data) with orange color
  const imageData = Buffer.from([
    0xf9, 0x73, 0x16 // Orange color #f97316 in RGB
  ]);
  
  const idat = Buffer.concat([
    Buffer.from([0x00, 0x00, 0x00, 0x0c]), // chunk length
    Buffer.from('IDAT'),
    Buffer.from([0x08, 0x99, 0x01, 0x01, 0x00, 0x00, 0xfe, 0xff]),
    imageData,
    Buffer.from([0x00, 0x00, 0x04, 0x26, 0xcd, 0xe3, 0xc5]) // compressed data + CRC
  ]);
  
  // IEND chunk (image end)
  const iend = Buffer.from([
    0x00, 0x00, 0x00, 0x00, // chunk length
    0x49, 0x45, 0x4e, 0x44, // 'IEND'
    0xae, 0x42, 0x60, 0x82  // CRC
  ]);
  
  return Buffer.concat([header, ihdr, idat, iend]);
}

async function main() {
  const publicDir = path.join(__dirname, '..', 'client', 'public');
  
  const sizes = [192, 512];
  const variants = ['', '-maskable'];
  
  let created = 0;
  
  for (const size of sizes) {
    for (const variant of variants) {
      const filename = `icon-${size}${variant}.png`;
      const filepath = path.join(publicDir, filename);
      
      try {
        const pngBuffer = createMinimalPNG(size);
        fs.writeFileSync(filepath, pngBuffer);
        console.log(`✅ Created ${filename}`);
        created++;
      } catch (error) {
        console.error(`❌ Error creating ${filename}:`, error.message);
      }
    }
  }
  
  console.log(`\n✨ Generated ${created}/${sizes.length * variants.length} icon files`);
}

main().catch(console.error);
