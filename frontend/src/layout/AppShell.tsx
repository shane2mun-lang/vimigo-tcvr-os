import { Outlet } from 'react-router-dom'
import { TopBar } from './TopBar'
import { SideNav } from './SideNav'
import { MobileNav } from './MobileNav'
import { ReportPrint } from '@/pdf/ReportPrint'

export function AppShell() {
  return (
    <>
      <div className="flex h-full flex-col print:hidden">
        <TopBar />
        <div className="flex min-h-0 flex-1">
          <SideNav />
          <main className="min-w-0 flex-1 overflow-y-auto">
            <MobileNav />
            <div className="mx-auto max-w-6xl px-4 py-6">
              <Outlet />
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
