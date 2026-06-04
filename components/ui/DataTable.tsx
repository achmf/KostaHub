import { AnimatedSection } from './AnimatedSection'

interface Column<T> {
  key: string
  label: string
  render?: (item: T) => React.ReactNode
  className?: string
}

interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  keyField: keyof T

  emptyState?: React.ReactNode
  className?: string
}

export function DataTable<T>({ columns, data, keyField, emptyState, className = '' }: DataTableProps<T>) {
  return (
    <AnimatedSection className={`bg-[#FFFFFF] rounded-[12px] border border-[#E8E8EC] overflow-hidden ${className}`}>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[#E8E8EC]">
              {columns.map(col => (
                <th
                  key={col.key}
                  className={`px-4 py-3 text-[11px] font-semibold text-[#9C9C9C] uppercase tracking-widest bg-[#FAFAFA] ${col.className ?? ''}`}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E8E8EC]">
            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="text-center">
                  {emptyState}
                </td>
              </tr>
            ) : (
              data.map(item => (
                <tr
                  key={String(item[keyField])}
                  className="transition-colors duration-150 hover:bg-[#FAFAFA]"
                >
                  {columns.map(col => (
                    <td key={col.key} className={`px-4 py-3.5 text-sm text-[#0A0A0A] ${col.className ?? ''}`}>
                      {col.render ? col.render(item) : String((item as Record<string, unknown>)[col.key] ?? '—')}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </AnimatedSection>
  )
}
