import os
from PIL import Image, ImageOps


def resize_photo(input_path: str) -> str:
    base, _ = os.path.splitext(input_path)
    output_path = base + ".jpg"

    with Image.open(input_path) as img:
        resized = ImageOps.fit(img.convert("RGB"), (300, 300), Image.LANCZOS)
        resized.save(output_path, "JPEG", quality=85)

    if output_path != input_path and os.path.exists(input_path):
        os.unlink(input_path)

    return output_path
