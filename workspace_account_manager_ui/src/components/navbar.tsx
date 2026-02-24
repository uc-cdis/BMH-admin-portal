'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@mantine/core';
import { APP_ROUTES } from '@/lib/utils/routes';

export function Navbar() {
  const { authenticated, userName, logout } = useAuth();
  const pathname = usePathname();

  return (
    <nav className="bg-gray-900 text-gray-300 shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center space-x-8">
            <Link href={APP_ROUTES.HOME} className="text-xl text-white">
              {(process.env.NEXT_PUBLIC_DISPLAY_NAME) || 'Workspace Admin Portal'}
            </Link>
            <div className="flex space-x-4">
              <Link
                href={APP_ROUTES.HOME}
                className={`hover:text-gray-100 ${pathname === APP_ROUTES.HOME ? 'border-b-2 border-white' : ''
                  }`}
              >
                Accounts
              </Link>
              <Link
                href="/request-workspace"
                className={`hover:text-gray-100 ${pathname === APP_ROUTES.REQUEST_WORKSPACE? 'border-b-2 border-white' : ''
                  }`}
              >
                Request Workspace
              </Link>
            </div>
          </div>
          {
            (authenticated) ? (
              <div className="flex items-center space-x-4">
                <Button
                  onClick={logout}
                  color='red.9'
                  fullWidth
                >
                  {`Logout (${userName})`}
                </Button>
              </div>
            ) : null
          }
        </div>
      </div>
    </nav>
  );
}
