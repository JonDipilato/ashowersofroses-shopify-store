#!/usr/bin/env python3
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def read(relative_path: str) -> str:
    return (ROOT / relative_path).read_text(encoding="utf-8")


checks = [
    ("layout/theme.liquid", 'render \'structured-data\'', "theme renders structured data"),
    ("layout/theme.liquid", 'property="og:title"', "Open Graph title is present"),
    ("layout/theme.liquid", 'name="twitter:card"', "Twitter card metadata is present"),
    ("snippets/structured-data.liquid", '"@type": "OnlineStore"', "OnlineStore schema is present"),
    ("snippets/structured-data.liquid", '"@type": "LocalBusiness"', "LocalBusiness schema is present"),
    ("snippets/structured-data.liquid", '360 West Boylston Street', "verified street address is present"),
    ("snippets/structured-data.liquid", '"@type": "Product"', "Product schema is present"),
    ("snippets/structured-data.liquid", '"@type": "FAQPage"', "FAQ schema is present"),
    ("templates/agents.md.liquid", '360 West Boylston Street', "agents.md includes verified location"),
    ("templates/llms.txt.liquid", 'Catholic religious books, gifts, and church goods', "llms.txt describes store categories"),
    ("templates/llms-full.txt.liquid", 'Do not assume shipping timelines', "llms-full includes fact guardrail"),
    ("sections/main-product.liquid", 'product-answer-block', "product direct-answer block is present"),
    ("sections/main-product.liquid", 'Shop with confidence', "product trust panel is present"),
    ("sections/main-collection.liquid", 'collection-answer-block', "collection direct-answer block is present"),
    ("sections/main-contact.liquid", '360 West Boylston Street', "contact page includes verified location"),
]

# Needles for filler copy are assembled at runtime so this guard file never
# contains the literal placeholder strings it is scanning for.
FILLER_LATIN = "Lorem" + " ipsum"

# Retired GoHighLevel sub-account (location LP0vMBhjtHVhDLUFyRNN), shut down
# July 2026. Its lead form, review widget, and LC Phone line are all dead —
# none of these may reappear in the theme.
DEAD_PHONE_PLAIN = "508-719-7968"
DEAD_PHONE_E164 = "+15087197968"

forbidden = [
    ("sections/main-product.liquid", "Add premium wrapping"),
    ("templates/product.json", "Add premium wrapping"),
    ("sections/trust-bar.liquid", "handwritten enclosure"),
    ("sections/trust-bar.liquid", "Secure checkout"),
    ("templates/index.json", "handwritten enclosure"),
    ("templates/index.json", "Secure checkout"),
    ("templates/index.json", FILLER_LATIN),
    ("templates/index.json", "Your Paragraph text"),
    ("snippets/structured-data.liquid", DEAD_PHONE_E164),
    ("sections/footer.liquid", DEAD_PHONE_PLAIN),
    ("sections/main-contact.liquid", DEAD_PHONE_PLAIN),
    ("templates/agents.md.liquid", DEAD_PHONE_PLAIN),
    ("templates/llms.txt.liquid", DEAD_PHONE_PLAIN),
    ("templates/llms-full.txt.liquid", DEAD_PHONE_PLAIN),
    ("templates/index.json", "leadconnectorhq.com"),
    ("templates/index.json", "reputationhub.site"),
    ("layout/theme.liquid", "leadconnectorhq.com"),
    ("layout/theme.liquid", "msgsndr.com"),
]

failures: list[str] = []

for relative_path, needle, description in checks:
    path = ROOT / relative_path
    if not path.exists():
        failures.append(f"{description}: missing {relative_path}")
        continue
    if needle not in read(relative_path):
        failures.append(f"{description}: missing {needle!r} in {relative_path}")

for relative_path, needle in forbidden:
    path = ROOT / relative_path
    if path.exists() and needle in read(relative_path):
        failures.append(f"unverified/filler text still present in {relative_path}: {needle!r}")

if failures:
    print("Theme SEO verification failed:")
    for failure in failures:
        print(f"- {failure}")
    raise SystemExit(1)

print("Theme SEO verification passed.")
