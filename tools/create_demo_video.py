from __future__ import annotations

import textwrap
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "assets"
FRAMES = ASSETS / "frames"
OUT = ASSETS / "agent-api-allowance-demo.mp4"


def font(size: int, bold: bool = False):
    candidates = [
        Path(r"C:\Windows\Fonts\consola.ttf"),
        Path(r"C:\Windows\Fonts\CascadiaMono.ttf"),
        Path(r"C:\Windows\Fonts\arial.ttf"),
    ]
    bold_candidates = [
        Path(r"C:\Windows\Fonts\consolab.ttf"),
        Path(r"C:\Windows\Fonts\CascadiaMono.ttf"),
        Path(r"C:\Windows\Fonts\arialbd.ttf"),
    ]
    path = next((p for p in (bold_candidates if bold else candidates) if p.exists()), None)
    if path:
        return ImageFont.truetype(str(path), size)
    return ImageFont.load_default()


def draw_wrapped(draw: ImageDraw.ImageDraw, xy: tuple[int, int], text: str, fnt, fill, width: int, gap: int = 8):
    x, y = xy
    for paragraph in text.splitlines():
        lines = textwrap.wrap(paragraph, width=width) or [""]
        for line in lines:
            draw.text((x, y), line, font=fnt, fill=fill)
            bbox = draw.textbbox((x, y), line or "X", font=fnt)
            y += bbox[3] - bbox[1] + gap
        y += 6
    return y


def make_frame(title: str, subtitle: str, body: str, footer: str, index: int):
    img = Image.new("RGB", (1280, 720), (9, 14, 22))
    draw = ImageDraw.Draw(img)
    green = (69, 219, 149)
    white = (236, 241, 247)
    muted = (151, 163, 179)
    panel = (16, 24, 38)
    border = (55, 68, 86)

    draw.rounded_rectangle((44, 36, 1236, 684), radius=22, fill=panel, outline=border, width=2)
    draw.ellipse((76, 70, 94, 88), fill=(250, 94, 85))
    draw.ellipse((104, 70, 122, 88), fill=(249, 190, 64))
    draw.ellipse((132, 70, 150, 88), fill=(64, 201, 111))
    draw.text((76, 116), title, font=font(40, True), fill=white)
    draw.text((78, 168), subtitle, font=font(24), fill=green)
    draw.line((76, 214, 1204, 214), fill=border, width=2)
    draw_wrapped(draw, (82, 244), body, font(25), white, 75, 7)
    draw.text((82, 636), footer, font=font(20), fill=muted)

    FRAMES.mkdir(parents=True, exist_ok=True)
    frame_path = FRAMES / f"frame-{index:02d}.png"
    img.save(frame_path)
    return frame_path


def main():
    ASSETS.mkdir(parents=True, exist_ok=True)
    frames = [
        make_frame(
            "Solana Agent API Allowance Demo",
            "$ npm run demo",
            "A TypeScript code sample for bounding AI-agent API spend with Solana subscriptions and allowances.\n\nNo private keys. No live transaction. The demo focuses on policy logic, spend caps, and SDK instruction mapping.",
            "Public repo: github.com/nonggde/solana-agent-api-allowance-demo",
            1,
        ),
        make_frame(
            "Fixed Delegation",
            "One review session, hard total cap",
            "Agent: Code-review agent\nAPI: paid repository intelligence API\nPrice: 0.05 USDC per call\nAllowance: 3 USDC total before expiry\nMaximum successful calls: 60",
            "Maps to: initSubscriptionAuthority -> createFixedDelegation -> transferFixed -> revokeDelegation",
            2,
        ),
        make_frame(
            "Recurring Delegation",
            "Daily operating budget for a long-running agent",
            "Agent: Support triage agent\nAPI: customer-safe document summarization API\nPrice: 0.025 USDC per call\nAllowance: 10 USDC per 86,400 second period\nMaximum successful calls per period: 400",
            "Maps to: initSubscriptionAuthority -> createRecurringDelegation -> transferRecurring -> revokeDelegation",
            3,
        ),
        make_frame(
            "Why It Matters",
            "Bounded payment capability instead of unlimited API keys",
            "The API gateway can pull payment after serving a request, but cannot exceed the configured cap.\n\nThe user keeps expiry and revoke controls. The agent gets enough autonomy to work without unlimited payment exposure.",
            "Best fit: paid API calls, AI workflow vendors, tool-using agents, usage-based SaaS APIs",
            4,
        ),
    ]
    concat = FRAMES / "concat.txt"
    with concat.open("w", encoding="utf-8") as f:
        for frame in frames:
            f.write(f"file '{frame.name}'\n")
            f.write("duration 4\n")
        f.write(f"file '{frames[-1].name}'\n")

    print(concat)
    print(OUT)


if __name__ == "__main__":
    main()
