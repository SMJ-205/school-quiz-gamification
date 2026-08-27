import os
from PIL import Image, ImageDraw
import numpy as np

os.makedirs('public/sprites', exist_ok=True)

# ─── 1. Load and process native Boy and Girl from the reference image ────────
im = Image.open('/Users/sarifmubdijantika/.gemini/antigravity-ide/brain/1f4ce9ae-eae3-460c-8fad-1426f6d08bd5/.user_uploaded/media_1787811823850.png').convert('RGBA')

# Background color in the reference image
bg_color = np.array([47, 60, 109], dtype=float)

# Extract Boy (Left character)
boy_crop = im.crop((45, 40, 440, 640))
arr_boy = np.array(boy_crop)
diff_boy = np.linalg.norm(arr_boy[:, :, :3] - bg_color, axis=2)
arr_boy[diff_boy < 28, 3] = 0
boy_clean = Image.fromarray(arr_boy)
boy_32x48 = boy_clean.resize((32, 48), Image.Resampling.LANCZOS)
boy_32x48.save('public/sprites/boy_base.png')

# Extract Girl (Right character)
girl_crop = im.crop((610, 40, 970, 640))
arr_girl = np.array(girl_crop)
diff_girl = np.linalg.norm(arr_girl[:, :, :3] - bg_color, axis=2)
arr_girl[diff_girl < 28, 3] = 0
girl_clean = Image.fromarray(arr_girl)
girl_32x48 = girl_clean.resize((32, 48), Image.Resampling.LANCZOS)
girl_32x48.save('public/sprites/girl_base.png')

# ─── 2. Generate Jumping Celebration Sprites for Certificate ──────────────────
# Extract jumping versions matching Image 3 (arms up)
# We can create a 32x48 jumping version for Boy and Girl
boy_jump = Image.new('RGBA', (32, 48), (0, 0, 0, 0))
girl_jump = Image.new('RGBA', (32, 48), (0, 0, 0, 0))

# Boy jump
# Head & Cap (top 24px)
boy_jump.paste(boy_32x48.crop((0, 0, 32, 26)), (0, 0))
# Body & legs (offset and altered pose)
boy_jump.paste(boy_32x48.crop((2, 26, 30, 48)), (2, 22), mask=boy_32x48.crop((2, 26, 30, 48)))
draw_b = ImageDraw.Draw(boy_jump)
# Left raised arm \
draw_b.line([(6, 26), (2, 18)], fill=(24, 24, 36, 255), width=2)
draw_b.line([(6, 26), (2, 18)], fill=(255, 255, 255, 255), width=1)
draw_b.point([(1, 17), (2, 17), (1, 18), (2, 18)], fill=(253, 205, 164, 255))
# Right raised arm /
draw_b.line([(24, 26), (28, 18)], fill=(24, 24, 36, 255), width=2)
draw_b.line([(24, 26), (28, 18)], fill=(255, 255, 255, 255), width=1)
draw_b.point([(28, 17), (29, 17), (28, 18), (29, 18)], fill=(253, 205, 164, 255))
boy_jump.save('public/sprites/boy_jumping.png')

# Girl jump
girl_jump.paste(girl_32x48.crop((0, 0, 32, 26)), (0, 0))
girl_jump.paste(girl_32x48.crop((2, 26, 30, 48)), (2, 22), mask=girl_32x48.crop((2, 26, 30, 48)))
draw_g = ImageDraw.Draw(girl_jump)
# Left raised arm \
draw_g.line([(6, 26), (2, 18)], fill=(24, 24, 36, 255), width=2)
draw_g.line([(6, 26), (2, 18)], fill=(255, 255, 255, 255), width=1)
draw_g.point([(1, 17), (2, 17), (1, 18), (2, 18)], fill=(253, 205, 164, 255))
# Right raised arm /
draw_g.line([(24, 26), (28, 18)], fill=(24, 24, 36, 255), width=2)
draw_g.line([(24, 26), (28, 18)], fill=(255, 255, 255, 255), width=1)
draw_g.point([(28, 17), (29, 17), (28, 18), (29, 18)], fill=(253, 205, 164, 255))
girl_jump.save('public/sprites/girl_jumping.png')

# ─── 3. Generate Layered Cosmetic Equipment at 32x48 ──────────────────────────

# A. BACKPACKS
# Red Explorer Rucksack
bp_red = Image.new('RGBA', (32, 48), (0, 0, 0, 0))
d = ImageDraw.Draw(bp_red)
# Left shoulder pack
d.rectangle([2, 24, 7, 36], fill=(200, 34, 34, 255), outline=(24, 24, 36, 255))
d.rectangle([3, 28, 6, 31], fill=(255, 215, 30, 255))
bp_red.save('public/sprites/backpack_red_backpack.png')

# Scout Leather Satchel
bp_scout = Image.new('RGBA', (32, 48), (0, 0, 0, 0))
d = ImageDraw.Draw(bp_scout)
d.rectangle([2, 24, 7, 36], fill=(130, 74, 34, 255), outline=(24, 24, 36, 255))
d.rectangle([3, 28, 6, 31], fill=(255, 215, 30, 255))
bp_scout.save('public/sprites/backpack_scout_satchel.png')

# Cosmic Pack
bp_cosmic = Image.new('RGBA', (32, 48), (0, 0, 0, 0))
d = ImageDraw.Draw(bp_cosmic)
d.rectangle([2, 24, 7, 36], fill=(0, 229, 255, 255), outline=(24, 24, 36, 255))
d.rectangle([3, 28, 6, 31], fill=(255, 255, 255, 255))
bp_cosmic.save('public/sprites/backpack_cosmic_pack.png')

# B. TOOLS (Held in right hand at x: 25-30, y: 16-36)
# Giant Magic Pencil
t_pencil = Image.new('RGBA', (32, 48), (0, 0, 0, 0))
d = ImageDraw.Draw(t_pencil)
# Pencil body angled
d.line([(26, 34), (30, 14)], fill=(24, 24, 36, 255), width=4)
d.line([(26, 34), (30, 14)], fill=(255, 215, 30, 255), width=2)
# Eraser tip
d.line([(29, 16), (30, 13)], fill=(255, 105, 140, 255), width=3)
# Sparkles
d.point([(28, 11), (31, 10)], fill=(0, 240, 255, 255))
t_pencil.save('public/sprites/tool_magic_pencil.png')

# Golden Ruler Wand
t_ruler = Image.new('RGBA', (32, 48), (0, 0, 0, 0))
d = ImageDraw.Draw(t_ruler)
d.line([(26, 34), (30, 12)], fill=(24, 24, 36, 255), width=4)
d.line([(26, 34), (30, 12)], fill=(255, 215, 30, 255), width=2)
# Star tip
d.rectangle([28, 10, 31, 13], fill=(255, 240, 100, 255), outline=(24, 24, 36, 255))
t_ruler.save('public/sprites/tool_ruler_wand.png')

# Starlight Compass
t_compass = Image.new('RGBA', (32, 48), (0, 0, 0, 0))
d = ImageDraw.Draw(t_compass)
d.ellipse([24, 24, 31, 31], fill=(255, 215, 30, 255), outline=(24, 24, 36, 255))
d.line([(26, 26), (29, 29)], fill=(220, 20, 20, 255), width=1)
d.line([(29, 26), (26, 29)], fill=(0, 229, 255, 255), width=1)
t_compass.save('public/sprites/tool_starlight_compass.png')

# Magnifying Glass
t_mag = Image.new('RGBA', (32, 48), (0, 0, 0, 0))
d = ImageDraw.Draw(t_mag)
d.ellipse([24, 20, 31, 27], fill=(0, 229, 255, 180), outline=(24, 24, 36, 255))
d.line([(25, 27), (23, 33)], fill=(130, 74, 34, 255), width=2)
t_mag.save('public/sprites/tool_magnifying_glass.png')

# C. GLASSES (x: 10-23, y: 15-20)
# Retro Round Glasses
g_round = Image.new('RGBA', (32, 48), (0, 0, 0, 0))
d = ImageDraw.Draw(g_round)
d.rectangle([10, 16, 15, 20], outline=(255, 215, 30, 255))
d.rectangle([17, 16, 22, 20], outline=(255, 215, 30, 255))
d.line([(15, 18), (17, 18)], fill=(255, 215, 30, 255))
g_round.save('public/sprites/glasses_retro_round.png')

# Smart Square Glasses
g_square = Image.new('RGBA', (32, 48), (0, 0, 0, 0))
d = ImageDraw.Draw(g_square)
d.rectangle([10, 16, 15, 20], fill=(0, 229, 255, 80), outline=(24, 24, 36, 255))
d.rectangle([17, 16, 22, 20], fill=(0, 229, 255, 80), outline=(24, 24, 36, 255))
d.line([(15, 17), (17, 17)], fill=(24, 24, 36, 255), width=2)
g_square.save('public/sprites/glasses_smart_square.png')

# Detective Monocle
g_monocle = Image.new('RGBA', (32, 48), (0, 0, 0, 0))
d = ImageDraw.Draw(g_monocle)
d.rectangle([17, 16, 22, 20], fill=(0, 229, 255, 80), outline=(255, 215, 30, 255))
d.line([(22, 20), (24, 26)], fill=(255, 215, 30, 255))
g_monocle.save('public/sprites/glasses_monocle.png')

# D. BADGES (Pinned at x: 19-23, y: 28-32)
# Scout Badge
b_scout = Image.new('RGBA', (32, 48), (0, 0, 0, 0))
d = ImageDraw.Draw(b_scout)
d.rectangle([19, 28, 23, 32], fill=(39, 174, 96, 255), outline=(24, 24, 36, 255))
d.point([(21, 30)], fill=(255, 215, 30, 255))
b_scout.save('public/sprites/badge_scout_badge.png')

# Gold Star Badge
b_star = Image.new('RGBA', (32, 48), (0, 0, 0, 0))
d = ImageDraw.Draw(b_star)
d.rectangle([19, 28, 23, 32], fill=(255, 215, 30, 255), outline=(24, 24, 36, 255))
d.point([(21, 30)], fill=(255, 255, 255, 255))
b_star.save('public/sprites/badge_gold_star.png')

# Science Flask Pin
b_flask = Image.new('RGBA', (32, 48), (0, 0, 0, 0))
d = ImageDraw.Draw(b_flask)
d.rectangle([19, 28, 23, 32], fill=(0, 229, 255, 255), outline=(24, 24, 36, 255))
b_flask.save('public/sprites/badge_science_flask.png')

# E. HEADGEAR OVERLAYS
# Scholar Beret
h_beret = Image.new('RGBA', (32, 48), (0, 0, 0, 0))
d = ImageDraw.Draw(h_beret)
d.ellipse([7, 3, 25, 12], fill=(28, 40, 70, 255), outline=(24, 24, 36, 255))
d.rectangle([15, 2, 17, 5], fill=(255, 215, 30, 255))
h_beret.save('public/sprites/headgear_beret.png')

# Explorer Headband
h_band = Image.new('RGBA', (32, 48), (0, 0, 0, 0))
d = ImageDraw.Draw(h_band)
d.rectangle([9, 13, 23, 16], fill=(220, 20, 20, 255), outline=(24, 24, 36, 255))
d.rectangle([14, 13, 18, 16], fill=(255, 255, 255, 255))
h_band.save('public/sprites/headgear_explorer_band.png')

print('All 32x48 layered PNG sprites generated and saved to public/sprites/ successfully!')
