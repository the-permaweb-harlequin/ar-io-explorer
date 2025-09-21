import { describe, expect, test } from 'vitest'

import App from './App'
import { render, screen } from './test/utils'

describe('App', () => {
  test('renders learn react link', () => {
    render(<App />)
    expect(screen.getByText('Learn React')).toBeInTheDocument()
  })

  test('renders learn tanstack link', () => {
    render(<App />)
    expect(screen.getByText('Learn TanStack')).toBeInTheDocument()
  })

  test('renders logo with correct alt text', () => {
    render(<App />)
    expect(screen.getByAltText('logo')).toBeInTheDocument()
  })
})
