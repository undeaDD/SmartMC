"""One-off script to generate the SmartController block's top texture
(off/on variants): a stone plate with a low-poly SM shield badge centered on
top, plus a small facing-direction arrow. Not part of the build -- run
manually, output committed directly to
src/main/resources/assets/smartmc/textures/block/. Swap for real art later
without touching model/blockstate/registration code -- block models use
virtual 0-16 UV space regardless of actual texture resolution, so this can
be re-run at a different SIZE later with zero other changes.

Renders the shield+"SM" mark at high supersample resolution with a real bold
font (for genuinely readable letterforms, not hand-pixeled guesswork), then
downsamples with nearest-neighbor to get hard, low-poly pixel edges instead
of smooth antialiasing.
"""

from PIL import Image, ImageDraw, ImageFont

SIZE = 64
SUPER = 4  # supersample factor for the shield+lettermark, then hard-downsample

# Brand palette (apps/landing/src/styles/theme.css)
STONE_BASE = (74, 74, 74)
STONE_EDGE = (58, 58, 58)
INK = (24, 24, 24)  # #181818, shield badge background
GREEN_DIM = (39, 92, 45)  # muted brand-green, "off" mark
GREEN_LIT = (92, 207, 104)  # #5ccf68, "on" mark
GRAY = (140, 140, 140)  # #8c8c8c, facing arrow


def shield_polygon(scale: int) -> list[tuple[int, int]]:
	# Flat-topped shield, symmetric, pointed base -- classic badge silhouette.
	cx = SIZE * scale // 2
	top = 9 * scale
	bottom = 55 * scale
	left = 12 * scale
	right = SIZE * scale - left
	mid = 38 * scale
	return [
		(left, top), (right, top),
		(right, mid), (cx, bottom), (left, mid),
	]


def draw_shield_and_mark(img: Image.Image, lit: bool) -> None:
	hi = Image.new("RGBA", (SIZE * SUPER, SIZE * SUPER), (0, 0, 0, 0))
	draw = ImageDraw.Draw(hi)

	mark = GREEN_LIT if lit else GREEN_DIM
	draw.polygon(shield_polygon(SUPER), fill=INK + (255,), outline=mark + (255,), width=2 * SUPER)

	font = ImageFont.truetype("arialbd.ttf", 22 * SUPER)
	text = "SM"
	bbox = draw.textbbox((0, 0), text, font=font)
	tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
	tx = (SIZE * SUPER - tw) // 2 - bbox[0]
	ty = (SIZE * SUPER - th) // 2 - bbox[1] - 2 * SUPER
	draw.text((tx, ty), text, font=font, fill=mark + (255,))

	low = hi.resize((SIZE, SIZE), Image.NEAREST)
	img.paste(low, (0, 0), low)


def draw_facing_arrow(draw: ImageDraw.ImageDraw) -> None:
	# Small triangle near the front edge (low Z / "north" before blockstate
	# rotation), pointing toward the front -- orientation hint, secondary to
	# the shield mark now that the shield is the main visual identity.
	cx = SIZE // 2
	draw.polygon([(cx - 4, 6), (cx + 4, 6), (cx, 2)], fill=GRAY)


def make(lit: bool) -> Image.Image:
	img = Image.new("RGBA", (SIZE, SIZE), STONE_BASE + (255,))
	draw = ImageDraw.Draw(img)

	border = SIZE // 16
	draw.rectangle([0, 0, SIZE - 1, border - 1], fill=STONE_EDGE)
	draw.rectangle([0, SIZE - border, SIZE - 1, SIZE - 1], fill=STONE_EDGE)
	draw.rectangle([0, 0, border - 1, SIZE - 1], fill=STONE_EDGE)
	draw.rectangle([SIZE - border, 0, SIZE - 1, SIZE - 1], fill=STONE_EDGE)

	draw_facing_arrow(draw)
	draw_shield_and_mark(img, lit)

	return img.convert("RGB")


def make_item_icon() -> Image.Image:
	# Flat 2D inventory icon (minecraft:item/generated), not the 3D block
	# model rendered at an angle -- same idea as vanilla's own repeater item
	# icon (a small plate viewed flat-on with markers on it), but with one
	# centered green dot standing in for the repeater's twin delay-torches.
	img = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
	draw = ImageDraw.Draw(img)

	pad = SIZE // 8
	draw.rounded_rectangle(
		[pad, pad, SIZE - 1 - pad, SIZE - 1 - pad],
		radius=SIZE // 10,
		fill=STONE_BASE + (255,),
		outline=STONE_EDGE + (255,),
		width=max(1, SIZE // 32),
	)

	line_w = max(1, SIZE // 32)
	cx = SIZE // 2
	draw.line([(cx, pad + line_w), (cx, SIZE - 1 - pad - line_w)], fill=GRAY, width=line_w)

	dot_r = SIZE // 10
	draw.ellipse([cx - dot_r, cx - dot_r, cx + dot_r, cx + dot_r], fill=GREEN_LIT)

	return img


def make_tab_icon() -> Image.Image:
	# A dedicated, standalone 16x16 badge -- NOT wired to any registered
	# item (the creative tab's actual functional icon is the real
	# smart_controller ItemStack, set in *Blocks.java). This is purely a
	# reference asset for hand-tweaking/reuse, matching the flat SM-shield
	# mark's look at the same small scale the block/item textures were
	# hand-downscaled to.
	icon_size = 16
	super_sample = 8
	img = Image.new("RGBA", (icon_size, icon_size), (0, 0, 0, 0))

	hi = Image.new("RGBA", (icon_size * super_sample, icon_size * super_sample), (0, 0, 0, 0))
	draw = ImageDraw.Draw(hi)
	s = super_sample
	shield = [
		(2 * s, 1 * s), (14 * s, 1 * s),
		(14 * s, 9 * s), (8 * s, 15 * s), (2 * s, 9 * s),
	]
	draw.polygon(shield, fill=INK + (255,), outline=GREEN_LIT + (255,), width=1 * s)

	font = ImageFont.truetype("arialbd.ttf", 6 * s)
	text = "SM"
	bbox = draw.textbbox((0, 0), text, font=font)
	tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
	tx = (icon_size * s - tw) // 2 - bbox[0]
	ty = (icon_size * s - th) // 2 - bbox[1] - s
	draw.text((tx, ty), text, font=font, fill=GREEN_LIT + (255,))

	low = hi.resize((icon_size, icon_size), Image.NEAREST)
	img.paste(low, (0, 0), low)
	return img


if __name__ == "__main__":
	out_dir = "../src/main/resources/assets/smartmc/textures"
	make(lit=False).save(f"{out_dir}/block/smart_controller.png")
	make(lit=True).save(f"{out_dir}/block/smart_controller_on.png")
	make_item_icon().save(f"{out_dir}/item/smart_controller.png")
	make_tab_icon().save(f"{out_dir}/gui/tab_icon_reference.png")
	print("wrote smart_controller.png and smart_controller_on.png at", SIZE, "x", SIZE)
	print("wrote item/smart_controller.png at", SIZE, "x", SIZE)
	print("wrote gui/tab_icon_reference.png at 16x16 (reference only, not wired to any item)")
