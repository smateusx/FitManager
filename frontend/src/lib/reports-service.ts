import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

type PdfDocWithPages = jsPDF & {
  internal: { getNumberOfPages: () => number }
}

export class ReportsService {
  /**
   * Exporta dados para um arquivo Excel (.xlsx)
   */
  static exportToExcel(data: Record<string, unknown>[], fileName: string) {
    const worksheet = XLSX.utils.json_to_sheet(data)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Relatório')

    // Gerar o arquivo e disparar o download
    XLSX.writeFile(workbook, `${fileName}.xlsx`)
  }

  /**
   * Exporta dados para um PDF formatado
   */
  static exportToPDF(
    columns: string[],
    rows: (string | number | null | undefined)[][],
    title: string,
    fileName: string
  ) {
    const doc = new jsPDF()

    // Configurações do Cabeçalho
    doc.setFontSize(20)
    doc.setTextColor(13, 13, 13) // Dark color
    doc.text('FITMANAGER', 14, 20)

    doc.setFontSize(10)
    doc.setTextColor(166, 166, 166) // Soft gray
    doc.text(`Relatório Gerado em: ${new Date().toLocaleString('pt-BR')}`, 14, 28)

    doc.setFontSize(14)
    doc.setTextColor(0, 0, 0)
    doc.text(title.toUpperCase(), 14, 40)

    // Linha separadora
    doc.setDrawColor(242, 183, 5) // Brand yellow #F2B705
    doc.setLineWidth(1)
    doc.line(14, 45, 196, 45)

    // Tabela
    autoTable(doc, {
      startY: 50,
      head: [columns],
      body: rows as string[][],
      theme: 'striped',
      headStyles: {
        fillColor: [13, 13, 13], // Dark bg
        textColor: [255, 255, 255],
        fontSize: 10,
        fontStyle: 'bold',
      },
      styles: {
        fontSize: 9,
        cellPadding: 3,
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245],
      },
    })

    // Rodapé
    const pageCount = (doc as PdfDocWithPages).internal.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i)
      doc.setFontSize(8)
      doc.setTextColor(166, 166, 166)
      doc.text(`Página ${i} de ${pageCount} | FitManager SaaS`, 14, doc.internal.pageSize.getHeight() - 10)
    }

    doc.save(`${fileName}.pdf`)
  }
}
