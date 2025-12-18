#!/usr/bin/env python3
"""
Generate PWA icons from SVG
Requires: pip install cairosvg pillow
"""

import subprocess
import sys
from pathlib import Path

def ensure_packages():
    """Install required packages"""
    try:
        import cairosvg
        from PIL import Image
    except ImportError:
        print("Installing required packages...")
        subprocess.check_call([sys.executable, "-m", "pip", "install", "cairosvg", "pillow"])

def generate_icon_png(size, maskable=False):
    """Generate PNG icon from SVG"""
    input_svg = Path(__file__).parent / "client" / "public" / "favicon.svg"
    
    if maskable:
        output_png = Path(__file__).parent / "client" / "public" / f"icon-{size}-maskable.png"
        # For maskable icons, add extra padding/safe area
        adjusted_size = int(size * 1.2)
    else:
        output_png = Path(__file__).parent / "client" / "public" / f"icon-{size}.png"
        adjusted_size = size
    
    try:
        import cairosvg
        cairosvg.svg2png(
            url=str(input_svg),
            write_to=str(output_png),
            output_width=adjusted_size,
            output_height=adjusted_size
        )
        print(f"✅ Generated: {output_png}")
        
        # For maskable icons, create safe area version
        if maskable:
            from PIL import Image
            img = Image.open(output_png)
            # Create new image with safe area (80% of image should be visible)
            safe_img = Image.new('RGBA', (adjusted_size, adjusted_size), (0, 0, 0, 0))
            # Center the original image
            offset = int((adjusted_size - size) / 2)
            safe_img.paste(img, (offset, offset), img)
            safe_img.save(output_png)
            print(f"   ✨ With safe area masking: {output_png}")
    except Exception as e:
        print(f"❌ Error generating {size}x{size} icon: {e}")
        print("   Fallback: Using simple PNG creation...")
        create_simple_png(size, maskable)

def create_simple_png(size, maskable=False):
    """Create a simple PNG icon without cairosvg"""
    try:
        from PIL import Image, ImageDraw
        
        if maskable:
            output_png = Path(__file__).parent / "client" / "public" / f"icon-{size}-maskable.png"
        else:
            output_png = Path(__file__).parent / "client" / "public" / f"icon-{size}.png"
        
        # Create image with orange background
        img = Image.new('RGBA', (size, size), (249, 115, 22, 255))  # #f97316
        draw = ImageDraw.Draw(img)
        
        # Draw yellow circle (plate)
        plate_size = int(size * 0.7)
        offset = (size - plate_size) // 2
        draw.ellipse(
            [offset, offset, offset + plate_size, offset + plate_size],
            fill=(253, 224, 71, 255)  # #fde047
        )
        
        # Draw three white circles (rotis)
        roti_size = int(size * 0.25)
        positions = [
            (size // 2, int(size * 0.3)),      # top
            (int(size * 0.3), int(size * 0.6)), # bottom-left
            (int(size * 0.7), int(size * 0.6))  # bottom-right
        ]
        
        for cx, cy in positions:
            x1 = cx - roti_size // 2
            y1 = cy - roti_size // 2
            x2 = cx + roti_size // 2
            y2 = cy + roti_size // 2
            draw.ellipse([x1, y1, x2, y2], fill=(255, 247, 237, 255), outline=(249, 115, 22, 255))
        
        img.save(output_png)
        print(f"✅ Generated: {output_png} (simple version)")
    except Exception as e:
        print(f"❌ Could not generate {size}x{size} icon: {e}")

if __name__ == "__main__":
    print("🎨 Generating PWA icons...")
    
    # Try to install and use cairosvg first
    try:
        ensure_packages()
    except:
        print("⚠️  cairosvg not available, using PIL fallback")
    
    # Generate all icon sizes
    print("\n📱 Creating standard icons...")
    generate_icon_png(192, maskable=False)
    generate_icon_png(512, maskable=False)
    
    print("\n🎭 Creating maskable icons...")
    generate_icon_png(192, maskable=True)
    generate_icon_png(512, maskable=True)
    
    print("\n✨ All icons generated!")
