import { describe, expect, test } from 'vitest'

import Dashboard from './Dashboard'
import { render, screen } from './test/utils'

describe('Dashboard', () => {
  test('renders dashboard title', () => {
    render(<Dashboard />)
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
  })

  test('renders welcome message', () => {
    render(<Dashboard />)
    expect(screen.getByText('Welcome to AR.IO Explorer - Your gateway to the Arweave ecosystem')).toBeInTheDocument()
  })

  test('renders total transactions card', () => {
    render(<Dashboard />)
    expect(screen.getByText('Total Transactions')).toBeInTheDocument()
  })
})
