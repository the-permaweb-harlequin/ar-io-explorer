import userEvent from '@testing-library/user-event'
import { describe, expect, test } from 'vitest'

import { render, screen } from '../../test/utils'
import { Button } from './button'

describe('Button', () => {
  test('renders with default variant', () => {
    render(<Button>Click me</Button>)
    const button = screen.getByRole('button', { name: 'Click me' })
    expect(button).toBeInTheDocument()
    expect(button).toHaveClass('bg-primary')
  })

  test('renders with secondary variant', () => {
    render(<Button variant="secondary">Secondary</Button>)
    const button = screen.getByRole('button', { name: 'Secondary' })
    expect(button).toHaveClass('bg-secondary')
  })

  test('renders with outline variant', () => {
    render(<Button variant="outline">Outline</Button>)
    const button = screen.getByRole('button', { name: 'Outline' })
    expect(button).toHaveClass('bg-background')
    expect(button).toHaveClass('border')
  })

  test('renders with different sizes', () => {
    render(<Button size="sm">Small</Button>)
    const button = screen.getByRole('button', { name: 'Small' })
    expect(button).toHaveClass('h-8')
  })

  test('handles click events', async () => {
    const user = userEvent.setup()
    const handleClick = () => {}

    render(<Button onClick={handleClick}>Click me</Button>)
    const button = screen.getByRole('button', { name: 'Click me' })

    await user.click(button)
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  test('can be disabled', () => {
    render(<Button disabled>Disabled</Button>)
    const button = screen.getByRole('button', { name: 'Disabled' })
    expect(button).toBeDisabled()
    expect(button).toHaveClass('disabled:pointer-events-none')
  })

  test('renders as child component when asChild is true', () => {
    render(
      <Button asChild>
        <a href="/test">Link Button</a>
      </Button>,
    )
    const link = screen.getByRole('link', { name: 'Link Button' })
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', '/test')
  })
})
