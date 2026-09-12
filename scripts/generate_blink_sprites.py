"""
generate_blink_sprites.py
Generates official eye-blinking sprite variants for "Petualangan Ilmu":
- Murid Laki-laki: boy_blink.png & boy_jumping_blink.png
- Murid Perempuan: girl_blink.png & girl_jumping_blink.png
"""

from PIL import Image, ImageDraw
import numpy as np
import os

def generate_blink_sprites():
    os.makedirs('public/sprites', exist_ok=True)
    W, H = 240, 360

    # 1. BOY BASE BLINK
    boy_base = Image.open('public/sprites/boy_base.png').convert('RGBA')
    boy_arr = np.array(boy_base)

    # Reconstruct eyelid skin using adjacent face tone
    for y in range(128, 147):
        boy_arr[y, 97:117] = boy_arr[y, 125]
        boy_arr[y, 154:173] = boy_arr[y, 148]

    boy_blink = Image.fromarray(boy_arr)
    draw_b = ImageDraw.Draw(boy_blink)

    lash_b = (36, 24, 28, 255)
    # Left eye closed lash line
    draw_b.rectangle([98, 137, 115, 139], fill=lash_b)
    draw_b.point([(97, 138), (116, 138)], fill=lash_b)
    # Right eye closed lash line
    draw_b.rectangle([154, 137, 171, 139], fill=lash_b)
    draw_b.point([(153, 138), (172, 138)], fill=lash_b)

    boy_blink.save('public/sprites/boy_blink.png')

    # 2. GIRL BASE BLINK
    girl_base = Image.open('public/sprites/girl_base.png').convert('RGBA')
    girl_arr = np.array(girl_base)

    # Reconstruct eyelid skin using adjacent nose bridge tone
    for y in range(128, 157):
        c_g = girl_arr[y, 140].copy()
        girl_arr[y, 90:123] = c_g
        girl_arr[y, 157:186] = c_g

    girl_blink = Image.fromarray(girl_arr)
    draw_g = ImageDraw.Draw(girl_blink)

    lash_g = (30, 20, 26, 255)
    # Left eye: cute curved anime lash
    draw_g.rectangle([93, 144, 116, 146], fill=lash_g)
    draw_g.rectangle([96, 143, 113, 145], fill=lash_g)
    draw_g.line([(93, 144), (89, 140)], fill=lash_g, width=2)
    draw_g.line([(92, 145), (88, 145)], fill=lash_g, width=2)

    # Right eye
    draw_g.rectangle([160, 144, 183, 146], fill=lash_g)
    draw_g.rectangle([163, 143, 180, 145], fill=lash_g)
    draw_g.line([(183, 144), (187, 140)], fill=lash_g, width=2)
    draw_g.line([(183, 145), (187, 145)], fill=lash_g, width=2)

    girl_blink.save('public/sprites/girl_blink.png')

    # 3. JUMPING VARIANTS
    # Boy Jumping
    boy_jump_blink = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    boy_jump_blink.paste(boy_blink.crop((0, 0, W, 180)), (0, -10))
    boy_jump_blink.paste(boy_blink.crop((0, 180, W, H)), (0, -20), mask=boy_blink.crop((0, 180, W, H)))
    d_bj = ImageDraw.Draw(boy_jump_blink)
    d_bj.line([(65, 180), (30, 120)], fill=(24, 24, 36, 255), width=12)
    d_bj.line([(65, 180), (30, 120)], fill=(255, 255, 255, 255), width=8)
    d_bj.ellipse([18, 108, 38, 128], fill=(253, 205, 164, 255), outline=(24, 24, 36, 255), width=3)
    d_bj.line([(175, 180), (210, 120)], fill=(24, 24, 36, 255), width=12)
    d_bj.line([(175, 180), (210, 120)], fill=(255, 255, 255, 255), width=8)
    d_bj.ellipse([202, 108, 222, 128], fill=(253, 205, 164, 255), outline=(24, 24, 36, 255), width=3)
    boy_jump_blink.save('public/sprites/boy_jumping_blink.png')

    # Girl Jumping
    girl_jump_blink = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    girl_jump_blink.paste(girl_blink.crop((0, 0, W, 180)), (0, -10))
    girl_jump_blink.paste(girl_blink.crop((0, 180, W, H)), (0, -20), mask=girl_blink.crop((0, 180, W, H)))
    d_gj = ImageDraw.Draw(girl_jump_blink)
    d_gj.line([(65, 180), (30, 120)], fill=(24, 24, 36, 255), width=12)
    d_gj.line([(65, 180), (30, 120)], fill=(255, 255, 255, 255), width=8)
    d_gj.ellipse([18, 108, 38, 128], fill=(253, 205, 164, 255), outline=(24, 24, 36, 255), width=3)
    d_gj.line([(175, 180), (210, 120)], fill=(24, 24, 36, 255), width=12)
    d_gj.line([(175, 180), (210, 120)], fill=(255, 255, 255, 255), width=8)
    d_gj.ellipse([202, 108, 222, 128], fill=(253, 205, 164, 255), outline=(24, 24, 36, 255), width=3)
    girl_jump_blink.save('public/sprites/girl_jumping_blink.png')

    print("Generated all eye blinking sprites successfully!")

if __name__ == '__main__':
    generate_blink_sprites()
