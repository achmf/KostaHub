import { KostaSpinner } from '@/components/KostaUI'

export default function DashboardLoading() {
  return (
    <div className="w-full h-[60vh] flex flex-col items-center justify-center gap-4">
      <KostaSpinner size="lg" color="ochre" text="Memuat Data..." />
    </div>
  )
}
