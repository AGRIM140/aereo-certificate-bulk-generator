"""Fixed template, font, page and text positions for the supplied design."""

from dataclasses import dataclass
from pathlib import Path


ASSETS_DIR = Path(__file__).resolve().parent / "assets"
TEMPLATE_PATH = ASSETS_DIR / "certificate_template.png"
FONT_REGULAR_PATH = ASSETS_DIR / "fonts" / "CormorantGaramond-Regular.ttf"
FONT_BOLD_PATH = ASSETS_DIR / "fonts" / "CormorantGaramond-Bold.ttf"
FONT_REGULAR = "CormorantGaramond"
FONT_BOLD = "CormorantGaramond-Bold"

# The cleaned asset keeps the supplied image's 1.370 aspect ratio at higher resolution.
IMAGE_WIDTH = 1468
IMAGE_HEIGHT = 1071
PAGE_WIDTH = 842.0
PAGE_HEIGHT = PAGE_WIDTH * IMAGE_HEIGHT / IMAGE_WIDTH
PAGE_SIZE = (PAGE_WIDTH, PAGE_HEIGHT)

BODY_SENTENCE = (
    "This certifies that <b>{recipient_name}</b> with Registration Number "
    "<b>{certificate_number}</b> has successfully completed <b>{event_name}</b>."
)
DATE_FORMAT = "%d %B %Y"


@dataclass(frozen=True)
class TextBox:
    """A text area in image pixels, measured from the upper-left corner."""

    left: int
    top: int
    right: int
    bottom: int
    color: str
    max_font_size: float
    min_font_size: float
    max_lines: int
    align: str = "center"


# The surrounding border, logos, medal and signature are outside these areas.
ORGANIZATION_BOX = TextBox(240, 485, 1228, 560, "#52A94E", 28, 10, 2)
BODY_BOX = TextBox(145, 565, 1323, 755, "#1E1A09", 21, 10, 7)
RECIPIENT_BOX = TextBox(85, 797, 545, 868, "#1E1A09", 15, 8, 4)
DATE_BOX = TextBox(165, 886, 440, 931, "#1E1A09", 13, 9, 2)
