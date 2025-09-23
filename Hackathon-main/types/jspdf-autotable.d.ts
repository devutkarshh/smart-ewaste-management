declare module 'jspdf-autotable' {
  import { jsPDF } from 'jspdf'

  interface AutoTableOptions {
    startY?: number
    head?: string[][]
    body?: string[][]
    theme?: 'striped' | 'grid' | 'plain'
    headStyles?: {
      fillColor?: number[]
      textColor?: number[]
      fontSize?: number
      fontStyle?: string
    }
    bodyStyles?: {
      fontSize?: number
    }
    alternateRowStyles?: {
      fillColor?: number[]
    }
    columnStyles?: {
      [key: number]: {
        cellWidth?: number
        halign?: 'left' | 'center' | 'right'
      }
    }
  }

  interface AutoTableResult {
    finalY: number
  }

  function autoTable(doc: jsPDF, options: AutoTableOptions): void

  export default autoTable

  declare module 'jspdf' {
    interface jsPDF {
      lastAutoTable: AutoTableResult
    }
  }
}
