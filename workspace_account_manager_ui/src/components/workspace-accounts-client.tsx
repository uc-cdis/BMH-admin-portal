'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { StridesWorkspaceTable } from './strides-workspace-table';
import { DirectPayWorkspaceTable } from './direct-pay-workspace-table';
import { getWorkspaces } from '@/lib/api/workspace-api';
import { authorizeAdmin } from '@/lib/auth/authorization';
import type { StridesWorkspace, DirectPayWorkspace } from '@/lib/types/workspace.types';

export function WorkspaceAccountsClient() {
  const [stridesWorkspaces, setStridesWorkspaces] = useState<StridesWorkspace[]>([]);
  const [directPayWorkspaces, setDirectPayWorkspaces] = useState<DirectPayWorkspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [adminAuthorized, setAdminAuthorized] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        // Check admin authorization
        // const isAdmin = await authorizeAdmin(
        //   { resource: '/admin', service: 'workspace_admin' },
        // );
        // setAdminAuthorized(isAdmin);

        // Fetch workspaces
        // const workspaces = await getWorkspaces();

        // Separate workspaces by type
        const strides: StridesWorkspace[] = [];
        const directPay: DirectPayWorkspace[] = [];

        // workspaces.forEach((workspace) => {
        //   if (workspace.workspace_type === 'Direct Pay') {
        //     directPay.push(workspace as DirectPayWorkspace);
        //   } else {
        //     strides.push(workspace as StridesWorkspace);
        //   }
        // });

        setStridesWorkspaces(strides);
        setDirectPayWorkspaces(directPay);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load workspaces. Please try again.');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading workspaces...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* STRIDES Workspaces Section */}
      <div className="py-5 text-center">
        <h2 className="text-3xl font-bold text-gray-800">
          STRIDES Credit Workspace Accounts
        </h2>
      </div>

      <StridesWorkspaceTable workspaces={stridesWorkspaces} />

      <div className="my-4 p-5 bg-yellow-50 border border-yellow-200 rounded">
        <small>
          <em className="font-bold">Warning:</em> When a Workspace reaches the STRIDES
          Credits limit (for STRIDES Credits Workspaces) or reaches the Hard Limit (for
          STRIDES Grant Workspaces), the Workspace will be automatically terminated.
          Please be sure to save any work before reaching the STRIDES Credit or Hard
          Limit.
        </small>
      </div>

      {/* Direct Pay Workspaces Section */}
      <div className="py-5 text-center mt-12">
        <h2 className="text-3xl font-bold text-gray-800">
          OCC Direct Pay Workspace Accounts
        </h2>
      </div>

      <DirectPayWorkspaceTable workspaces={directPayWorkspaces} />

      <div className="my-4 p-5 bg-yellow-50 border border-yellow-200 rounded">
        <small>
          <em className="font-bold">Warning:</em> When a Workspace reaches the soft
          limit, OCC will send an email requesting more funds be added to your account.
          If it reaches the hard limit and further payment is not processed, the
          workspace will automatically be terminated. Please be sure to save any work
          before reaching the Hard Limit.
        </small>
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-4 mt-8">
        <Link
          href="/request-workspace"
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
        >
          Request New Workspace
        </Link>
        {adminAuthorized && (
          <Link
            href="/admin"
            className="px-6 py-3 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 font-semibold"
          >
            Administrate Workspace
          </Link>
        )}
      </div>
    </div>
  );
}
