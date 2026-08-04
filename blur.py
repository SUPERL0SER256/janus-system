import sys
try:
    from PIL import Image, ImageFilter
    import os

    input_path = "public/bg-landscape2.png"
    if not os.path.exists(input_path):
        print("Image not found")
        sys.exit(0)

    img = Image.open(input_path)
    # Convert to RGB if needed, but keeping PNG is fine
    if img.mode in ("RGBA", "P"):
        img = img.convert("RGB")
        
    # Blur slightly
    blurred_img = img.filter(ImageFilter.GaussianBlur(radius=4))
    
    output_path = "public/bg-landscape2-blurred.jpg"
    blurred_img.save(output_path, "JPEG", optimize=True, quality=80)
    print("Success: Blurred and saved to JPEG")
except Exception as e:
    print(f"Failed: {e}")
