import { Link } from '@tanstack/react-router'

export default function Header() {
  return (
    <header className="flex justify-between gap-2 bg-white p-2 text-black">
      <nav className="flex flex-row">
        <div className="px-2 font-bold">
          <Link to="/" className="hover:text-blue-600 hover:underline transition-colors cursor-pointer">Home</Link>
        </div>

        <div className="px-2 font-bold">
          <Link to="/demo/tanstack-query" className="hover:text-blue-600 hover:underline transition-colors cursor-pointer">TanStack Query</Link>
        </div>

        <div className="px-2 font-bold">
          <Link to="/demo/table" className="hover:text-blue-600 hover:underline transition-colors cursor-pointer">TanStack Table</Link>
        </div>

        <div className="px-2 font-bold">
          <Link to="/demo/form/simple" className="hover:text-blue-600 hover:underline transition-colors cursor-pointer">Simple Form</Link>
        </div>

        <div className="px-2 font-bold">
          <Link to="/demo/form/address" className="hover:text-blue-600 hover:underline transition-colors cursor-pointer">Address Form</Link>
        </div>
      </nav>
    </header>
  )
}
