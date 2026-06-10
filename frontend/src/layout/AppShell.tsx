import { TopBar } from './TopBar'
import { SideNav } from './SideNav'
import { MobileNav } from './MobileNav'
import { AllSections } from '@/pages/AllSections'
import { ReportPrint } from '@/pdf/ReportPrint'

export function AppShell() {
  return (
    <>
      <div className="flex h-full flex-col print:hidden">
        <TopBar />
        <div className="flex min-h-0 flex-1">
          <SideNav />
          {/* The single continuous-scroll surface; sidebar items anchor-scroll into it. */}
          <main id="main-scroll" className="min-w-0 flex-1 overflow-y-auto scroll-smooth">
            <MobileNav />
            <div className="mx-auto max-w-6xl px-4 py-6">
              <AllSections />
            </div>
          </main>
        </div>
      </div>
      {/* Print-only report (revealed by @media print → Save as PDF) */}
      <div className="hidden print:block">
        <ReportPrint />
      </div>
    </>
  )
}
