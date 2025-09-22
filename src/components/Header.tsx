import { Link } from '@tanstack/react-router'

export default function Header() {
  return (
    <header className="flex justify-between gap-2 bg-white p-2 text-black">
      <nav className="flex flex-row">
        <div className="px-2 font-bold">
          <Link
            to="/"
            className="cursor-pointer transition-colors hover:text-blue-600 hover:underline"
          >
            Home
          </Link>
        </div>

        <div className="px-2 font-bold">
          <Link
            to="/settings"
            className="cursor-pointer transition-colors hover:text-blue-600 hover:underline"
          >
            Settings
          </Link>
        </div>
      </nav>
    </header>
  )
}
