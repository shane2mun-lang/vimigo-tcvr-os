import type { ReactNode } from 'react'
import { cn } from './ui'

export function TableShell({
  head,
  children,
  footer,
}: {
  head: ReactNode
  children: ReactNode
  footer?: ReactNode
}) {
  return (
    <div className="overflow-x-auto rounded-xl ring-1 ring-slate-200">
      <table className="w-full min-w-[720px] border-collapse text-sm">
        <thead className="bg-slate-50 text-xs font-medium uppercase tracking-wide text-slate-500">
          {head}
        </thead>
        <tbody className="divide-y divide-slate-100">{children}</tbody>
        {footer && <tfoot className="border-t-2 border-slate-200 bg-slate-50 font-medium">{footer}</tfoot>}
      </table>
    </div>
  )
}

export function Th({ children, className }: { children?: ReactNode; className?: string }) {
  return <th className={cn('px-3 py-2.5 text-left font-medium whitespace-nowrap', className)}>{children}</th>
}

export function Td({ children, className }: { children?: ReactNode; className?: string }) {
  return <td className={cn('px-2 py-1.5 align-middle', className)}>{children}</td>
}

export function RemoveRowButton({ onClick, title }: { onClick: () => void; title?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className="rounded-md px-2 py-1 text-slate-300 transition hover:bg-red-50 hover:text-red-500"
    >
      ✕
    </button>
  )
}
