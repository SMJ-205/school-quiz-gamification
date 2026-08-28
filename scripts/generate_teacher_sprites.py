"""
generate_teacher_sprites.py
Generates teacher_idle.png (closed mouth) and teacher_talking.png (expressive open talking mouth)
from pristine teacher.png without cheek glares or misplaced lines.
"""

from PIL import Image
import numpy as np

SRC = "public/sprites/teacher.png"
OUT_IDLE = "public/sprites/teacher_idle.png"
OUT_TALK = "public/sprites/teacher_talking.png"

# Load source teacher sprite and scale cleanly
orig = Image.open(SRC).convert("RGBA")
orig_320 = orig.resize((320, 699), Image.Resampling.LANCZOS)

# 1. Base Idle: Pristine resized teacher sprite
idle_arr = np.array(orig_320)

# 2. Talking Frame: Open mouth with clear teeth, dark mouth cavity, and tongue
talk_arr = idle_arr.copy()

# Colors
c_teeth = [242, 240, 238, 255]
c_teeth_sh = [210, 205, 200, 255]
c_cavity = [65, 18, 18, 255]
c_dark = [40, 10, 10, 255]
c_tongue = [205, 90, 85, 255]
c_tongue_sh = [170, 70, 65, 255]
c_lip = [50, 22, 16, 255]

for y in range(280, 288):
    for x in range(175, 198):
        dx = (x - 186.5) / 10.5
        dy = (y - 283.5) / 3.8
        dist_sq = dx * dx + dy * dy

        if dist_sq <= 1.0:
            if y in [281, 282]:  # Upper teeth
                if x in range(179, 194):
                    talk_arr[y, x] = c_teeth if y == 281 else c_teeth_sh
                else:
                    talk_arr[y, x] = c_cavity
            elif y in [283, 284]:  # Cavity opening
                talk_arr[y, x] = c_dark if y == 283 else c_cavity
            elif y in [285, 286]:  # Tongue / lower lip
                if dist_sq <= 0.85 and x in range(180, 193):
                    talk_arr[y, x] = c_tongue if y == 285 else c_tongue_sh
                else:
                    talk_arr[y, x] = c_cavity
        elif dist_sq <= 1.35:
            talk_arr[y, x] = c_lip

# Save both sprites
Image.fromarray(idle_arr, "RGBA").save(OUT_IDLE)
Image.fromarray(talk_arr, "RGBA").save(OUT_TALK)

print(f"Saved {OUT_IDLE} and {OUT_TALK} successfully!")
