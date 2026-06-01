import base64
from PIL import Image, ImageDraw
import os

output_dir = r"d:/workspace2026/outproject/training-plan/miniapp/src/static/tabbar"
os.makedirs(output_dir, exist_ok=True)

def create_green_icon(name, draw_func, size=81):
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    draw_func(draw, size)
    img.save(os.path.join(output_dir, f"{name}.png"), "PNG")

# Home icon - house shape
def draw_home(draw, size):
    s = size
    green = "#10b981"
    # roof
    points = [(s//2, s//8), (s//8, s//3), (s*7//8, s//3)]
    draw.polygon(points, fill=green)
    # body
    draw.rectangle([s//6, s//3, s*5//6, s*7//8], fill=green)
    # door
    draw.rectangle([s*2//5, s*4//7, s*3//5, s*7//8], fill="white")

create_green_icon("home-green", draw_home)
create_green_icon("home-active-green", draw_home)

# Plan icon - calendar with check
def draw_plan(draw, size):
    s = size
    green = "#10b981"
    # calendar body
    draw.rectangle([s//8, s//5, s*7//8, s*7//8], fill=green)
    # top bar
    draw.rectangle([s//8, s//5, s*7//8, s*3//8], fill="#059669")
    # calendar hook
    draw.rectangle([s*2//5, s//10, s*3//5, s//3], fill="#059669")
    # checkmark
    draw.line([(s//3, s//2), (s//2, s*5//8), (s*2//3, s//3)], fill="white", width=max(3, s//20))

create_green_icon("plan-green", draw_plan)
create_green_icon("plan-active-green", draw_plan)

# Record icon - chart bars
def draw_record(draw, size):
    s = size
    green = "#10b981"
    dark_green = "#059669"
    # bar 1
    draw.rectangle([s//8, s*3//8, s*3//8, s*7//8], fill=green)
    # bar 2
    draw.rectangle([s*3//8, s//4, s*5//8, s*7//8], fill=dark_green)
    # bar 3
    draw.rectangle([s*5//8, s*2//5, s*7//8, s*7//8], fill=green)
    # baseline
    draw.rectangle([s//8, s*7//8-2, s*7//8, s*7//8], fill=green)

create_green_icon("record-green", draw_record)
create_green_icon("record-active-green", draw_record)

# Mine icon - person avatar
def draw_mine(draw, size):
    s = size
    green = "#10b981"
    # head
    draw.ellipse([s*3//8, s//6, s*5//8, s*4//9], fill=green)
    # body/shoulders
    draw.ellipse([s//6, s*4//9, s*5//6, s*7//8], fill=green)

create_green_icon("mine-green", draw_mine)
create_green_icon("mine-active-green", draw_mine)

print("Green tabbar icons created successfully!")
print(f"Icons saved to: {output_dir}")
