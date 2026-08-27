"""
generate_teacher_sprites.py
Generates teacher_idle.png (closed mouth) and teacher_talking.png from teacher.png.
"""

from PIL import Image
import numpy as np

SRC      = "public/sprites/teacher.png"
OUT_IDLE = "public/sprites/teacher_idle.png"
OUT_TALK = "public/sprites/teacher_talking.png"

img = Image.open(SRC).convert("RGBA")
w, h = img.size
print(f"Source: {w}x{h}")
arr = np.array(img)

# ── Detect white teeth region in face zone ────────────────────────────────────
face_top    = int(h * 0.25)
face_bottom = int(h * 0.56)
face_left   = int(w * 0.15)
face_right  = int(w * 0.85)
region = arr[face_top:face_bottom, face_left:face_right]

r, g, b, a = region[:,:,0], region[:,:,1], region[:,:,2], region[:,:,3]
teeth_mask = (r > 200) & (g > 200) & (b > 200) & (a > 200)
rows, cols = np.where(teeth_mask)

if len(rows) == 0:
    print("No teeth pixels found — aborting")
    exit(1)

y_min, y_max = rows.min(), rows.max()
x_min, x_max = cols.min(), cols.max()
abs_y_min = face_top + y_min
abs_y_max = face_top + y_max
abs_x_min = face_left + x_min
abs_x_max = face_left + x_max
print(f"Teeth abs coords: y={abs_y_min}-{abs_y_max}, x={abs_x_min}-{abs_x_max}")

# ── Sample skin colour from above the teeth ───────────────────────────────────
sample_y = max(0, abs_y_min - 8)
strip = arr[sample_y, abs_x_min:abs_x_max+1]
opaque_non_white = strip[(strip[:,3] > 150) & ~((strip[:,0]>200)&(strip[:,1]>200)&(strip[:,2]>200))]
if len(opaque_non_white) == 0:
    opaque_non_white = arr[abs_y_min-3, abs_x_min:abs_x_max+1]
    opaque_non_white = opaque_non_white[opaque_non_white[:,3]>150]
skin_color = opaque_non_white.mean(axis=0).astype(np.uint8)
print(f"Skin tone: RGBA {skin_color}")

# ── Build idle (closed mouth) ─────────────────────────────────────────────────
idle = arr.copy()
pad_top = 5
y1 = max(0, abs_y_min - pad_top)
y2 = min(h - 1, abs_y_max + 2)

for y in range(y1, y2 + 1):
    for x in range(abs_x_min - 1, abs_x_max + 2):
        if 0 <= x < w and idle[y, x, 3] > 50:
            idle[y, x] = skin_color

# Draw a thin dark closed-lip line
lip_y = y1 + 2
lip_color = np.array([75, 38, 25, 255], dtype=np.uint8)
for x in range(abs_x_min, abs_x_max + 1):
    if 0 <= x < w and 0 <= lip_y < h and idle[lip_y, x, 3] > 50:
        idle[lip_y, x] = lip_color

Image.fromarray(idle, 'RGBA').save(OUT_IDLE)
print(f"Saved: {OUT_IDLE}")

img.save(OUT_TALK)
print(f"Saved: {OUT_TALK}")
print("Done!")
