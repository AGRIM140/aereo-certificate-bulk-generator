"""Generate one certificate PDF in memory from the fixed bundled template."""

from datetime import date
from io import BytesIO
from math import ceil
from xml.sax.saxutils import escape

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from reportlab.lib.styles import ParagraphStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas
from reportlab.platypus import Paragraph

from certificates import template_config as config


class TextDoesNotFitError(ValueError):
    """The supplied text cannot fit inside its designated template area."""


def _register_fonts() -> None:
    """ReportLab keeps a process-wide font registry; register each face once."""
    registered = pdfmetrics.getRegisteredFontNames()
    if config.FONT_REGULAR not in registered:
        pdfmetrics.registerFont(TTFont(config.FONT_REGULAR, str(config.FONT_REGULAR_PATH)))
    if config.FONT_BOLD not in registered:
        pdfmetrics.registerFont(TTFont(config.FONT_BOLD, str(config.FONT_BOLD_PATH)))
    pdfmetrics.registerFontFamily(
        config.FONT_REGULAR, normal=config.FONT_REGULAR, bold=config.FONT_BOLD
    )


def _page_box(box: config.TextBox) -> tuple[float, float, float, float]:
    scale = config.PAGE_WIDTH / config.IMAGE_WIDTH
    left = box.left * scale
    bottom = (config.IMAGE_HEIGHT - box.bottom) * scale
    return left, bottom, (box.right - box.left) * scale, (box.bottom - box.top) * scale


def _style(box: config.TextBox, font_size: float) -> ParagraphStyle:
    alignment = {"left": TA_LEFT, "center": TA_CENTER, "right": TA_RIGHT}[box.align]
    return ParagraphStyle(
        "certificate-field",
        fontName=config.FONT_REGULAR,
        fontSize=font_size,
        leading=font_size * 1.12,
        textColor=colors.HexColor(box.color),
        alignment=alignment,
        allowWidows=0,
        allowOrphans=0,
    )


def _draw_paragraph(pdf: canvas.Canvas, markup: str, box: config.TextBox) -> None:
    """Shrink text until it fits; never draw outside its configured area."""
    left, bottom, width, height = _page_box(box)
    size = box.max_font_size
    while size >= box.min_font_size:
        style = _style(box, size)
        paragraph = Paragraph(markup, style)
        _, measured_height = paragraph.wrap(width, height)
        line_count = ceil(measured_height / style.leading)
        if measured_height <= height and line_count <= box.max_lines:
            paragraph.drawOn(pdf, left, bottom + (height - measured_height) / 2)
            return
        size -= 0.5
    raise TextDoesNotFitError("Text does not fit the certificate template.")


def _draw_fitted_field(pdf: canvas.Canvas, value: str, box: config.TextBox) -> None:
    """Prefer one line, then use the configured wrapping space if needed."""
    _, _, width, _ = _page_box(box)
    size = box.max_font_size
    while size >= box.min_font_size:
        if pdfmetrics.stringWidth(value, config.FONT_BOLD, size) <= width:
            _draw_paragraph(pdf, f"<b>{escape(value)}</b>", box)
            return
        size -= 0.5
    _draw_paragraph(pdf, f"<b>{escape(value)}</b>", box)


def generate_certificate_pdf(
    recipient_name: str,
    event_name: str,
    organization_name: str,
    issue_date: date,
    certificate_number: str,
) -> bytes:
    """Return PDF bytes; read only the fixed template and bundled fonts."""
    _register_fonts()
    output = BytesIO()
    pdf = canvas.Canvas(output, pagesize=config.PAGE_SIZE, pageCompression=1)
    pdf.drawImage(
        str(config.TEMPLATE_PATH), 0, 0,
        width=config.PAGE_WIDTH, height=config.PAGE_HEIGHT,
    )

    _draw_fitted_field(pdf, organization_name, config.ORGANIZATION_BOX)
    body = config.BODY_SENTENCE.format(
        recipient_name=escape(recipient_name),
        certificate_number=escape(certificate_number),
        event_name=escape(event_name),
    )
    _draw_paragraph(pdf, body, config.BODY_BOX)
    _draw_fitted_field(pdf, recipient_name, config.RECIPIENT_BOX)
    _draw_fitted_field(pdf, issue_date.strftime(config.DATE_FORMAT), config.DATE_BOX)

    pdf.showPage()
    pdf.save()
    return output.getvalue()
