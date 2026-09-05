"""Generate a static invitation QR; contains only the public sign-in URL."""
import sys
from reportlab.graphics.barcode.qr import QrCodeWidget
from reportlab.graphics.shapes import Drawing
from reportlab.graphics import renderSVG
url = sys.argv[1]
code = QrCodeWidget(url, barLevel='M')
drawing = Drawing(200, 200)
code.barWidth = code.barHeight = 200
drawing.add(code)
renderSVG.drawToFile(drawing, 'dist/join.svg')
