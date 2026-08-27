import os
from PIL import Image, ImageDraw
import numpy as np

os.makedirs('public/sprites', exist_ok=True)

# ─── Load Base HD Images ──────────────────────────────────────────────────────
im = Image.open('/Users/sarifmubdijantika/.gemini/antigravity-ide/brain/1f4ce9ae-eae3-460c-8fad-1426f6d08bd5/.user_uploaded/media_1787811823850.png').convert('RGBA')
arr = np.array(im)
bg_color = np.array([47, 60, 109], dtype=float)

W, H = 240, 360

# 1. Extract Boy
boy_raw = arr[44:636, 54:430].copy()
diff = np.linalg.norm(boy_raw[:, :, :3] - bg_color, axis=2)
boy_raw[diff < 32, 3] = 0
img_b = Image.fromarray(boy_raw)
b_scaled = img_b.resize((int(img_b.width * (330 / img_b.height)), 330), Image.Resampling.NEAREST)

boy_base = Image.new('RGBA', (W, H), (0, 0, 0, 0))
boy_base.paste(b_scaled, ((W - b_scaled.width) // 2, H - b_scaled.height - 10))
boy_base.save('public/sprites/boy_base.png')

# 2. Boy with Natural Hair (no cap)
# Copy boy_base and replace the red cap dome with brown hair
boy_no_cap = boy_base.copy()
d_bnc = ImageDraw.Draw(boy_no_cap)
# Hair color from sprite
h_dark = (56, 28, 16, 255)
h_mid  = (84, 45, 26, 255)
h_out  = (24, 24, 36, 255)
# Fill top of head with hair
d_bnc.ellipse([58, 48, 178, 115], fill=h_dark, outline=h_out, width=4)
d_bnc.ellipse([70, 56, 165, 105], fill=h_mid)
d_bnc.rectangle([68, 75, 172, 110], fill=h_dark)
# Tuft of hair
d_bnc.polygon([(110, 110), (125, 128), (140, 110)], fill=h_dark)
boy_no_cap.save('public/sprites/boy_hair_only.png')

# 3. Extract Girl
girl_raw = arr[44:636, 618:962].copy()
diff_g = np.linalg.norm(girl_raw[:, :, :3] - bg_color, axis=2)
girl_raw[diff_g < 32, 3] = 0
img_g = Image.fromarray(girl_raw)
g_scaled = img_g.resize((int(img_g.width * (330 / img_g.height)), 330), Image.Resampling.NEAREST)

girl_base = Image.new('RGBA', (W, H), (0, 0, 0, 0))
girl_base.paste(g_scaled, ((W - g_scaled.width) // 2, H - g_scaled.height - 10))
girl_base.save('public/sprites/girl_base.png')

# 4. Jumping Celebration Sprites for Certificate (Matching Image 3)
boy_jump = Image.new('RGBA', (W, H), (0, 0, 0, 0))
boy_jump.paste(boy_base.crop((0, 0, W, 180)), (0, -10))
boy_jump.paste(boy_base.crop((0, 180, W, H)), (0, -20), mask=boy_base.crop((0, 180, W, H)))
d_bj = ImageDraw.Draw(boy_jump)
# Left raised arm \o
d_bj.line([(65, 180), (30, 120)], fill=(24, 24, 36, 255), width=12)
d_bj.line([(65, 180), (30, 120)], fill=(255, 255, 255, 255), width=8)
d_bj.ellipse([18, 108, 38, 128], fill=(253, 205, 164, 255), outline=(24, 24, 36, 255), width=3)
# Right raised arm o/
d_bj.line([(175, 180), (210, 120)], fill=(24, 24, 36, 255), width=12)
d_bj.line([(175, 180), (210, 120)], fill=(255, 255, 255, 255), width=8)
d_bj.ellipse([202, 108, 222, 128], fill=(253, 205, 164, 255), outline=(24, 24, 36, 255), width=3)
boy_jump.save('public/sprites/boy_jumping.png')

girl_jump = Image.new('RGBA', (W, H), (0, 0, 0, 0))
girl_jump.paste(girl_base.crop((0, 0, W, 180)), (0, -10))
girl_jump.paste(girl_base.crop((0, 180, W, H)), (0, -20), mask=girl_base.crop((0, 180, W, H)))
d_gj = ImageDraw.Draw(girl_jump)
# Left raised arm \o
d_gj.line([(65, 180), (30, 120)], fill=(24, 24, 36, 255), width=12)
d_gj.line([(65, 180), (30, 120)], fill=(255, 255, 255, 255), width=8)
d_gj.ellipse([18, 108, 38, 128], fill=(253, 205, 164, 255), outline=(24, 24, 36, 255), width=3)
# Right raised arm o/
d_gj.line([(175, 180), (210, 120)], fill=(24, 24, 36, 255), width=12)
d_gj.line([(175, 180), (210, 120)], fill=(255, 255, 255, 255), width=8)
d_gj.ellipse([202, 108, 222, 128], fill=(253, 205, 164, 255), outline=(24, 24, 36, 255), width=3)
girl_jump.save('public/sprites/girl_jumping.png')

# ─── 5. Layered Cosmetic Accessories on (240 x 360) ───────────────────────────

# A. BACKPACKS (Positioned at left shoulder: x: 20-55, y: 165-275)
# Red Explorer Backpack
bp_red = Image.new('RGBA', (W, H), (0, 0, 0, 0))
d = ImageDraw.Draw(bp_red)
d.rounded_rectangle([18, 165, 52, 265], radius=8, fill=(200, 34, 34, 255), outline=(24, 24, 36, 255), width=4)
d.rectangle([25, 200, 45, 220], fill=(255, 215, 30, 255), outline=(24, 24, 36, 255), width=2)
bp_red.save('public/sprites/backpack_red_backpack.png')

# Scout Leather Satchel
bp_scout = Image.new('RGBA', (W, H), (0, 0, 0, 0))
d = ImageDraw.Draw(bp_scout)
d.rounded_rectangle([18, 165, 52, 265], radius=8, fill=(130, 74, 34, 255), outline=(24, 24, 36, 255), width=4)
d.rectangle([25, 200, 45, 220], fill=(255, 215, 30, 255), outline=(24, 24, 36, 255), width=2)
bp_scout.save('public/sprites/backpack_scout_satchel.png')

# Cosmic Pack
bp_cosmic = Image.new('RGBA', (W, H), (0, 0, 0, 0))
d = ImageDraw.Draw(bp_cosmic)
d.rounded_rectangle([18, 165, 52, 265], radius=8, fill=(0, 210, 245, 255), outline=(24, 24, 36, 255), width=4)
d.rectangle([25, 200, 45, 220], fill=(255, 255, 255, 255), outline=(24, 24, 36, 255), width=2)
bp_cosmic.save('public/sprites/backpack_cosmic_pack.png')

# B. TOOLS (Held at right hand: x: 180-235, y: 110-270)
# Giant Magic Pencil
t_pencil = Image.new('RGBA', (W, H), (0, 0, 0, 0))
d = ImageDraw.Draw(t_pencil)
# Angled pencil body
d.line([(190, 260), (225, 115)], fill=(24, 24, 36, 255), width=18)
d.line([(190, 260), (225, 115)], fill=(255, 215, 30, 255), width=12)
# Metal band & Pink eraser tip
d.line([(220, 135), (228, 105)], fill=(220, 225, 235, 255), width=12)
d.line([(224, 120), (230, 95)], fill=(255, 105, 140, 255), width=12)
# Sparkle stars at tip
d.point([(232, 85), (236, 88), (228, 80), (235, 75)], fill=(0, 240, 255, 255))
t_pencil.save('public/sprites/tool_magic_pencil.png')

# Golden Ruler Wand
t_ruler = Image.new('RGBA', (W, H), (0, 0, 0, 0))
d = ImageDraw.Draw(t_ruler)
d.line([(190, 260), (225, 110)], fill=(24, 24, 36, 255), width=16)
d.line([(190, 260), (225, 110)], fill=(255, 215, 30, 255), width=10)
# Star top
d.ellipse([215, 95, 235, 115], fill=(255, 245, 100, 255), outline=(24, 24, 36, 255), width=3)
t_ruler.save('public/sprites/tool_ruler_wand.png')

# Starlight Compass
t_compass = Image.new('RGBA', (W, H), (0, 0, 0, 0))
d = ImageDraw.Draw(t_compass)
d.ellipse([185, 195, 230, 240], fill=(255, 215, 30, 255), outline=(24, 24, 36, 255), width=4)
d.ellipse([192, 202, 223, 233], fill=(20, 30, 50, 255))
d.line([(200, 225), (215, 210)], fill=(220, 20, 20, 255), width=3)
d.line([(215, 210), (208, 218)], fill=(0, 229, 255, 255), width=3)
t_compass.save('public/sprites/tool_starlight_compass.png')

# Magnifying Glass
t_mag = Image.new('RGBA', (W, H), (0, 0, 0, 0))
d = ImageDraw.Draw(t_mag)
d.ellipse([180, 160, 225, 205], fill=(0, 229, 255, 160), outline=(24, 24, 36, 255), width=4)
d.line([(190, 200), (180, 245)], fill=(130, 74, 34, 255), width=8)
t_mag.save('public/sprites/tool_magnifying_glass.png')

# C. GLASSES (Fitted over eyes: x: 95-170, y: 110-145)
# Retro Round Glasses
g_round = Image.new('RGBA', (W, H), (0, 0, 0, 0))
d = ImageDraw.Draw(g_round)
d.ellipse([92, 110, 126, 144], outline=(255, 215, 30, 255), width=3)
d.ellipse([136, 110, 170, 144], outline=(255, 215, 30, 255), width=3)
d.line([(126, 124), (136, 124)], fill=(255, 215, 30, 255), width=3)
g_round.save('public/sprites/glasses_retro_round.png')

# Smart Square Glasses
g_square = Image.new('RGBA', (W, H), (0, 0, 0, 0))
d = ImageDraw.Draw(g_square)
d.rectangle([92, 112, 126, 142], fill=(0, 229, 255, 70), outline=(24, 24, 36, 255), width=4)
d.rectangle([136, 112, 170, 142], fill=(0, 229, 255, 70), outline=(24, 24, 36, 255), width=4)
d.line([(126, 124), (136, 124)], fill=(24, 24, 36, 255), width=4)
g_square.save('public/sprites/glasses_smart_square.png')

# Detective Monocle
g_monocle = Image.new('RGBA', (W, H), (0, 0, 0, 0))
d = ImageDraw.Draw(g_monocle)
d.ellipse([136, 110, 170, 144], fill=(0, 229, 255, 70), outline=(255, 215, 30, 255), width=3)
d.line([(168, 130), (180, 170)], fill=(255, 215, 30, 255), width=2)
g_monocle.save('public/sprites/glasses_monocle.png')

# D. BADGES (Pinned to chest: x: 135-160, y: 195-225)
# Scout Badge
b_scout = Image.new('RGBA', (W, H), (0, 0, 0, 0))
d = ImageDraw.Draw(b_scout)
d.rectangle([136, 196, 156, 218], fill=(39, 174, 96, 255), outline=(24, 24, 36, 255), width=3)
d.ellipse([142, 202, 150, 212], fill=(255, 215, 30, 255))
b_scout.save('public/sprites/badge_scout_badge.png')

# Gold Star Badge
b_star = Image.new('RGBA', (W, H), (0, 0, 0, 0))
d = ImageDraw.Draw(b_star)
d.rectangle([136, 196, 156, 218], fill=(255, 215, 30, 255), outline=(24, 24, 36, 255), width=3)
d.ellipse([142, 202, 150, 212], fill=(255, 255, 255, 255))
b_star.save('public/sprites/badge_gold_star.png')

# Science Flask Pin
b_flask = Image.new('RGBA', (W, H), (0, 0, 0, 0))
d = ImageDraw.Draw(b_flask)
d.rectangle([136, 196, 156, 218], fill=(0, 210, 245, 255), outline=(24, 24, 36, 255), width=3)
d.ellipse([142, 202, 150, 212], fill=(255, 255, 255, 255))
b_flask.save('public/sprites/badge_science_flask.png')

# E. HEADGEAR OVERLAYS
# Scholar Beret (Fitted over head: x: 60-180, y: 35-95)
h_beret = Image.new('RGBA', (W, H), (0, 0, 0, 0))
d = ImageDraw.Draw(h_beret)
d.ellipse([60, 35, 180, 95], fill=(28, 40, 75, 255), outline=(24, 24, 36, 255), width=4)
d.ellipse([112, 30, 128, 46], fill=(255, 215, 30, 255), outline=(24, 24, 36, 255), width=2)
h_beret.save('public/sprites/headgear_beret.png')

# Explorer Headband (x: 65-175, y: 90-115)
h_band = Image.new('RGBA', (W, H), (0, 0, 0, 0))
d = ImageDraw.Draw(h_band)
d.rectangle([68, 92, 172, 114], fill=(220, 20, 20, 255), outline=(24, 24, 36, 255), width=4)
d.rectangle([105, 92, 135, 114], fill=(255, 255, 255, 255))
h_band.save('public/sprites/headgear_explorer_band.png')

# Official Red Cap (For Girl or Boy overlay)
h_cap = Image.new('RGBA', (W, H), (0, 0, 0, 0))
# Can take cap crop from boy
h_cap.paste(boy_base.crop((0, 0, W, 120)), (0, 0))
h_cap.save('public/sprites/headgear_sd_cap.png')

print('All 240x360 HD layered sprites generated successfully!')
