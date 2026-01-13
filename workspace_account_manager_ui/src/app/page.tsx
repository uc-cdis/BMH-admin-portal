import { redirect } from 'next/navigation';
import { isServerAuthenticated } from '@/lib/auth/server-auth';
import { WorkspaceAccountsClient } from '@/components/workspace-accounts-client';

export default async function WorkspaceAccountsPage() {
  const authenticated = await isServerAuthenticated();

  if (!authenticated) {
    redirect('/login');
  }

  return <WorkspaceAccountsClient />;
}
