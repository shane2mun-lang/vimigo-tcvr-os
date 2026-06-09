// Export the TCVR report as PDF. The printable report (<ReportPrint/>) is mounted
// hidden inside AppShell and only becomes visible under @media print, so triggering
// the browser print dialog ("Save as PDF") produces a clean, bilingual report with
// no font-embedding hassle and full offline support.

export function exportTcvrReport(): void {
  window.print()
}
