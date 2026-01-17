import { redirect } from 'next/navigation';
import { WorkspaceAccountsClient } from '@/components/workspace-accounts-client';
import { isAuthenticated } from '@/lib/auth/oidc';

export default async function WorkspaceAccountsPage() {
  return <WorkspaceAccountsClient />;
}
