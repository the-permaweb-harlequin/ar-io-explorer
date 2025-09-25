import { ANTVersionsStatistics } from '@/components/ANTVersionsStatistics'

function Dashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome to AR.IO Explorer - Your gateway to the Arweave ecosystem
        </p>
      </div>
      <div className="w-fit">
        <ANTVersionsStatistics />
      </div>
    </div>
  )
}

export default Dashboard
