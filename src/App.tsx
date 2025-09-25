function Dashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome to AR.IO Explorer - Your gateway to the Arweave ecosystem
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border bg-card p-6 text-card-foreground shadow-sm">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="text-sm font-medium">Total Transactions</h3>
          </div>
          <div className="text-2xl font-bold">1,234,567</div>
          <p className="text-xs text-muted-foreground">
            +20.1% from last month
          </p>
        </div>

        <div className="rounded-lg border bg-card p-6 text-card-foreground shadow-sm">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="text-sm font-medium">Active Nodes</h3>
          </div>
          <div className="text-2xl font-bold">45</div>
          <p className="text-xs text-muted-foreground">+2 from last week</p>
        </div>

        <div className="rounded-lg border bg-card p-6 text-card-foreground shadow-sm">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="text-sm font-medium">Network Health</h3>
          </div>
          <div className="text-2xl font-bold">99.9%</div>
          <p className="text-xs text-muted-foreground">Excellent</p>
        </div>

        <div className="rounded-lg border bg-card p-6 text-card-foreground shadow-sm">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="text-sm font-medium">Data Stored</h3>
          </div>
          <div className="text-2xl font-bold">2.4 PB</div>
          <p className="text-xs text-muted-foreground">+180 GB today</p>
        </div>
      </div>

      <div className="rounded-lg border bg-card p-6">
        <h3 className="mb-4 text-lg font-semibold">Recent Activity</h3>
        <div className="space-y-4">
          <div className="flex items-center space-x-4">
            <div className="h-2 w-2 rounded-full bg-green-500"></div>
            <div className="flex-1">
              <p className="text-sm font-medium">New transaction confirmed</p>
              <p className="text-xs text-muted-foreground">
                Block height: 1,234,567
              </p>
            </div>
            <div className="text-xs text-muted-foreground">2 min ago</div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="h-2 w-2 rounded-full bg-blue-500"></div>
            <div className="flex-1">
              <p className="text-sm font-medium">Data item uploaded</p>
              <p className="text-xs text-muted-foreground">Size: 1.2 MB</p>
            </div>
            <div className="text-xs text-muted-foreground">5 min ago</div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="h-2 w-2 rounded-full bg-orange-500"></div>
            <div className="flex-1">
              <p className="text-sm font-medium">Node joined network</p>
              <p className="text-xs text-muted-foreground">
                Gateway: ar-io.dev
              </p>
            </div>
            <div className="text-xs text-muted-foreground">12 min ago</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
