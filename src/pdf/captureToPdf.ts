import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'

/**
 * Renders `element` to a multi-page A4 PDF and triggers a browser download.
 */
export async function downloadDomAsPdf(element: HTMLElement, fileName: string): Promise<void> {
  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    backgroundColor: '#ffffff',
    logging: false,
    width: element.scrollWidth,
    height: element.scrollHeight,
    windowWidth: element.scrollWidth,
    windowHeight: element.scrollHeight,
  })

  const imgData = canvas.toDataURL('image/png', 1.0)
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  })

  const pageW = pdf.internal.pageSize.getWidth()
  const pageH = pdf.internal.pageSize.getHeight()
  const imgW = pageW
  const imgH = (canvas.height * imgW) / canvas.width

  let y = 0
  let remaining = imgH

  pdf.addImage(imgData, 'PNG', 0, y, imgW, imgH)
  remaining -= pageH

  while (remaining > 0) {
    y -= pageH
    pdf.addPage()
    pdf.addImage(imgData, 'PNG', 0, y, imgW, imgH)
    remaining -= pageH
  }

  const safe =
    fileName.replace(/[/\\?%*:|"<>]/g, '-').trim() || 'planta-camaras'
  pdf.save(safe.endsWith('.pdf') ? safe : `${safe}.pdf`)
}
