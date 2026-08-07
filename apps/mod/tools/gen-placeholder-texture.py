"""One-off script to generate the SmartController block's placeholder top
texture (off/on variants). Not part of the build -- run manually, output
committed directly to src/main/resources/assets/smartmc/textures/block/.
Swap for real art later without touching model/blockstate/registration code.
"""

from PIL import Image

SIZE = 16

# Brand palette (apps/landing/src/styles/theme.css)
INK = (24, 24, 24)  # #181818
STONE_BASE = (74, 74, 74)  # neutral plate base, distinct from vanilla stone
STONE_EDGE = (58, 58, 58)
GREEN_DIM = (39, 92, 45)  # muted brand-green, "off" indicator
GREEN_LIT = (92, 207, 104)  # #5ccf68, "on" indicator, bright/emissive-looking
GRAY = (140, 140, 140)  # #8c8c8c


def make(lit: bool) -> Image.Image:
	img = Image.new("RGB", (SIZE, SIZE), STONE_BASE)
	px = img.load()

	# Plate border
	for x in range(SIZE):
		for y in range(SIZE):
			if x == 0 or y == 0 or x == SIZE - 1 or y == SIZE - 1:
				px[x, y] = STONE_EDGE

	# Small central "screen" panel (device status readout)
	for x in range(5, 11):
		for y in range(5, 11):
			px[x, y] = INK

	indicator = GREEN_LIT if lit else GREEN_DIM
	for x in range(6, 10):
		for y in range(6, 10):
			px[x, y] = indicator

	# Directional line from back (y=15, input) to front (y=1, output),
	# matching a redstone repeater's own directional affordance -- points
	# toward -Z (north) before blockstate rotation is applied.
	for y in range(2, 14):
		px[8, y] = GRAY if not lit else indicator

	return img


if __name__ == "__main__":
	out_dir = "../src/main/resources/assets/smartmc/textures/block"
	make(lit=False).save(f"{out_dir}/smart_controller.png")
	make(lit=True).save(f"{out_dir}/smart_controller_on.png")
	print("wrote smart_controller.png and smart_controller_on.png")
