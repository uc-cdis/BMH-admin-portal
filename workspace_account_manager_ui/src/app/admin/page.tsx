import { redirect } from 'next/navigation';
import { isServerAuthenticated } from '@/lib/auth/server-auth';
import { authorizeAdmin } from '@/lib/auth/authorization';

export default async function AdminPage() {
  const authenticated = await isServerAuthenticated();

  if (!authenticated) {
    redirect('/login');
  }

  // Check admin authorization
  const authorized = await authorizeAdmin(
    { resource: '/admin', service: 'workspace_admin' },
    process.env.ARBORIST_URI!,
    process.env.API_GW_ENDPOINT!,
    process.env.API_KEY!
  );

  if (!authorized) {
    redirect('/?error=unauthorized');
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-4">Admin Dashboard</h1>
      <p className="text-gray-600">
        Admin-only workspace administration panel.
      </p>
    </div>
  );
}
