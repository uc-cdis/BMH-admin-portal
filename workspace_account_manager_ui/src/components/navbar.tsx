'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';

export function Navbar() {
  const { authenticated, userName, logout } = useAuth();
  const pathname = usePathname();

  console.log('Navbar state:', { authenticated, userName });

  return (
    <nav className="bg-gray-900 text-gray-300 shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center space-x-8">
            <Link href="/" className="text-xl text-white">
              {(process.env.NEXT_PUBLIC_DISPLAY_NAME) || 'Workspace Admin Portal'}
            </Link>
            <div className="flex space-x-4">
              <Link
                href="/"
                className={`hover:text-gray-100 ${
                  pathname === '/' ? 'border-b-2 border-white' : ''
                }`}
              >
                Accounts
              </Link>
              <Link
                href="/request-workspace"
                className={`hover:text-gray-100 ${
                  pathname === '/request-workspace' ? 'border-b-2 border-white' : ''
                }`}
              >
                Request Workspace
              </Link>
            </div>
          </div>
          {
            (authenticated) ? (
              <div className="flex items-center space-x-4">
                <span className="text-sm">{userName}</span>
                <button
                  onClick={logout}
                  className="px-4 py-2 bg-red-500 hover:bg-red-600 rounded text-sm"
                >
                  Logout
                </button>
              </div>
             ) : null
          }
        </div>
      </div>
    </nav>
  );
}
