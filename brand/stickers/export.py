"""Export each sticker in sticker-ideas.html as a print file.

For every sticker: a 600 dpi PNG with a transparent background (the die-cut
follows the white edge) and a vector PDF at the exact print size.
Needs Google Chrome and a network connection (fonts load from Google Fonts).

    python3 brand/stickers/export.py
"""
import re, subprocess, pathlib, tempfile

HERE = pathlib.Path(__file__).resolve().parent
SRC = (HERE / "sticker-ideas.html").read_text()
OUT = HERE / "print"
CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
DPI = 600

# symbol id, file name, tight viewBox (the sticker's outer white edge), print width and height in inches
STICKERS = [
    ("st-talk",   "3x3in_lets-talk",          (4, 4, 292, 292)),
    ("st-note",   "4x1.75in_ask-me-to-build-yours", (2, 2, 416, 176)),
    ("st-qr",     "3x2in-upright_say-hi-or-scan-QR", (0, 0, 260, 330)),
    ("st-story",  "5x3in_i-build-websites-and-apps", (0, 0, 540, 150)),
    ("st-build",  "4x1.75in_lets-build-it",    (0, 0, 440, 190)),
    ("st-ask",    "3x2in_ask-me-what-im-building", (8, 8, 344, 248)),
    ("st-napkin", "3x3in_need-a-website-or-app", (0, 0, 300, 300)),
    ("st-mark",   "2x1in_studio-npv-wordmark", (0, 0, 270, 112)),
]
BOX = {"st-talk": (3, 3), "st-note": (4, 1.75), "st-qr": (2, 3), "st-story": (5, 3),
       "st-build": (4, 1.75), "st-ask": (3, 2), "st-napkin": (3, 3), "st-mark": (2, 1)}

FONTS = re.search(r'<link rel="stylesheet" href="https://fonts.googleapis.com[^>]+>', SRC).group(0)
QR_JS = re.search(r'(<script src="https://cdnjs[^<]+</script>\s*<script>.*?</script>)', SRC, re.S).group(1)

def fit(vb, box):
    w, h = vb[2], vb[3]
    s = min(box[0] / w, box[1] / h)
    return w * s, h * s

OUT.mkdir(exist_ok=True)
for sid, name, vb in STICKERS:
    inner = re.search(rf'<symbol id="{sid}" viewBox="[^"]+">(.*?)</symbol>', SRC, re.S).group(1)
    w_in, h_in = fit(vb, BOX[sid])
    wpx, hpx = round(w_in * 96), round(h_in * 96)
    page = f"""<!doctype html><html><head><meta charset="utf-8">{FONTS}
<style>@page {{ size: {w_in:.4f}in {h_in:.4f}in; margin: 0 }}
html,body {{ margin:0; padding:0; background: transparent; overflow: hidden }}
svg {{ display:block; width:{w_in:.4f}in; height:{h_in:.4f}in }}</style></head><body>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="{' '.join(map(str, vb))}">{inner}</svg>
{QR_JS if sid == 'st-qr' else ''}</body></html>"""
    with tempfile.NamedTemporaryFile("w", suffix=".html", delete=False) as f:
        f.write(page)
        url = "file://" + f.name
    common = [CHROME, "--headless=new", "--disable-gpu", "--hide-scrollbars",
              "--virtual-time-budget=8000", "--run-all-compositor-stages-before-draw"]
    subprocess.run(common + [f"--screenshot={OUT / (name + '.png')}", f"--window-size={wpx},{hpx}",
                             f"--force-device-scale-factor={DPI / 96}",
                             "--default-background-color=00000000", url],
                   check=True, capture_output=True)
    subprocess.run(common + [f"--print-to-pdf={OUT / (name + '.pdf')}", "--no-pdf-header-footer", url],
                   check=True, capture_output=True)
    print(f"{name}: {w_in:.2f} x {h_in:.2f} in")
