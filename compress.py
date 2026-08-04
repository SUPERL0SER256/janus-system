import sys
try:
    from PIL import Image
    import os

    input_path = "public/bg-landscape.png"
    if not os.path.exists(input_path):
        print("Image not found")
        sys.exit(0)

    # Open image
    img = Image.open(input_path)
    
    # Convert to RGB (in case it's RGBA and we want to save as JPEG)
    if img.mode in ("RGBA", "P"):
        img = img.convert("RGB")
        
    # Resize slightly if it's massive to save more space, or just compress
    # Let's just compress it as a high-quality JPEG
    output_path = "public/bg-landscape.jpg"
    img.save(output_path, "JPEG", optimize=True, quality=60)
    print("Success: Compressed to JPEG")
except Exception as e:
    print(f"Failed: {e}")
