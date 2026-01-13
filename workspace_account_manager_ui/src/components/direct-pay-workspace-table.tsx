'use client';

import type { DirectPayWorkspace } from '@/lib/types/workspace.types';

interface Props {
  workspaces: DirectPayWorkspace[];
}

export function DirectPayWorkspaceTable({ workspaces }: Props) {
  const formatDollar = (value: number) => `$${value.toLocaleString()}`;
  const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);

  const getWorkspaceLink = () => {
    const authUri = process.env.NEXT_PUBLIC_OIDC_AUTH_URI || '';
    const domain = authUri.split('/')[2];
    return `https://${domain}/workspace`;
  };

  if (workspaces.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No active workspaces to view.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white border border-gray-300 shadow-sm rounded-lg">
        <thead className="bg-gray-100">
          <tr>
            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
              OCC Request ID
            </th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
              Request Status
            </th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
              Workspace Type
            </th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
              Total Usage
            </th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
              Compute Purchased
            </th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
              Soft Limit
            </th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
              Hard Limit
            </th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
              Workspaces Link
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {workspaces.map((workspace) => (
            <tr key={workspace.directpay_workspace_id} className="hover:bg-gray-50">
              <td className="px-4 py-3 text-sm text-gray-900">
                {workspace.bmh_workspace_id}
              </td>
              <td className="px-4 py-3 text-sm text-gray-900">
                {capitalize(workspace.request_status)}
              </td>
              <td className="px-4 py-3 text-sm text-gray-900">
                {workspace.workspace_type}
              </td>
              <td className="px-4 py-3 text-sm text-gray-900">
                {formatDollar(workspace['total-usage'])}
              </td>
              <td className="px-4 py-3 text-sm text-gray-900">
                {formatDollar(workspace.direct_pay_limit)}
              </td>
              <td className="px-4 py-3 text-sm text-gray-900">
                {formatDollar(workspace['soft-limit'])}
              </td>
              <td className="px-4 py-3 text-sm text-gray-900">
                {formatDollar(workspace['hard-limit'])}
              </td>
              <td className="px-4 py-3 text-sm">
                <a
                  href={getWorkspaceLink()}
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-600 hover:text-blue-800 underline"
                >
                  Link
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
