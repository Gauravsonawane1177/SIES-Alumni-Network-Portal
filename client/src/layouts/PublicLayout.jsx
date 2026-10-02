import { Link } from 'react-router-dom';

export default function PublicLayout({ children }) {
  return (
    <div className="min-h-screen bg-ivory">
      <header className="bg-maroon-800 text-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Link to="/" className="font-display text-xl">
            SIES Alumni Network Portal
          </Link>
          <nav className="flex gap-4 text-sm">
            <Link to="/login">Login</Link>
            <Link to="/register" className="rounded bg-gold-500 px-3 py-1 font-semibold text-maroon-900">
              Register
            </Link>
          </nav>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}
