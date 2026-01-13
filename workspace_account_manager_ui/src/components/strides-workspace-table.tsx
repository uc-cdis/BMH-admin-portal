'use client';

import { useState } from 'react';
import { BiEditAlt } from 'react-icons/bi';
import { setWorkspaceLimits } from '@/lib/api/workspace-api';
import type { StridesWorkspace, WorkspaceLimits } from '@/lib/types/workspace.types';

interface Props {
  workspaces: StridesWorkspace[];
}

export function StridesWorkspaceTable({ workspaces }: Props) {
  const [data, setData] = useState(workspaces);
  const [editingCell, setEditingCell] = useState<{
    id: string;
    field: 'soft-limit' | 'hard-limit';
  } | null>(null);
  const [editValue, setEditValue] = useState('');

  const formatDollar = (value: number) => `$${value.toLocaleString()}`;
  const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);

  const getWorkspaceLink = () => {
    const authUri = process.env.NEXT_PUBLIC_OIDC_AUTH_URI || '';
    const domain = authUri.split('/')[2];
    return `https://${domain}/workspace`;
  };

  const handleEdit = (
    workspaceId: string,
    field: 'soft-limit' | 'hard-limit',
    currentValue: number
  ) => {
    setEditingCell({ id: workspaceId, field });
    setEditValue(currentValue.toString());
  };

  const validateAndSave = async (workspace: StridesWorkspace) => {
    if (!editingCell) return;

    const newValue = parseInt(editValue);
    const { field } = editingCell;

    // Validation
    if (field === 'soft-limit') {
      if (newValue >= workspace['hard-limit']) {
        alert('Soft limit must be less than hard limit.');
        return;
      }
      if (newValue <= 0) {
        alert('Soft limit must be greater than 0 (zero).');
        return;
      }
    } else {
      // hard-limit
      if (newValue <= workspace['soft-limit']) {
        alert('Hard limit must be greater than soft limit.');
        return;
      }
      if (
        workspace['strides-credits'] !== null &&
        workspace['strides-credits'] !== 0 &&
        newValue > workspace['strides-credits']
      ) {
        alert('Hard limit must be less than or equal to the Strides Credits amount.');
        return;
      }
    }

    // Update via API
    try {
      const limits: WorkspaceLimits = {
        'soft-limit': workspace['soft-limit'],
        'hard-limit': workspace['hard-limit'],
      };
      limits[field] = newValue;

      await setWorkspaceLimits(workspace.bmh_workspace_id, limits);

      // Update local state
      setData((prev) =>
        prev.map((w) =>
          w.bmh_workspace_id === workspace.bmh_workspace_id
            ? { ...w, [field]: newValue }
            : w
        )
      );

      setEditingCell(null);
    } catch (err) {
      console.error('Error updating limits:', err);
      alert('Failed to update workspace limits.');
    }
  };

  const handleKeyDown = (
    e: React.KeyboardEvent,
    workspace: StridesWorkspace
  ) => {
    if (e.key === 'Enter') {
      validateAndSave(workspace);
    } else if (e.key === 'Escape') {
      setEditingCell(null);
    }
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
              NIH Award/Grant ID
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
              Strides Credits
            </th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
              Soft Limit <BiEditAlt className="inline ml-1" />
            </th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
              Hard Limit <BiEditAlt className="inline ml-1" />
            </th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
              Workspaces Link
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {data.map((workspace) => (
            <tr key={workspace.bmh_workspace_id} className="hover:bg-gray-50">
              <td className="px-4 py-3 text-sm text-gray-900">
                {workspace.nih_funded_award_number}
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
                {workspace['strides-credits'] !== null
                  ? formatDollar(workspace['strides-credits'])
                  : 'N/A'}
              </td>
              <td
                className="px-4 py-3 text-sm text-gray-900 cursor-pointer"
                onClick={() =>
                  !editingCell &&
                  handleEdit(
                    workspace.bmh_workspace_id,
                    'soft-limit',
                    workspace['soft-limit']
                  )
                }
              >
                {editingCell?.id === workspace.bmh_workspace_id &&
                editingCell.field === 'soft-limit' ? (
                  <input
                    type="number"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onBlur={() => validateAndSave(workspace)}
                    onKeyDown={(e) => handleKeyDown(e, workspace)}
                    className="w-full px-2 py-1 border border-blue-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    autoFocus
                  />
                ) : (
                  formatDollar(workspace['soft-limit'])
                )}
              </td>
              <td
                className="px-4 py-3 text-sm text-gray-900 cursor-pointer"
                onClick={() =>
                  !editingCell &&
                  handleEdit(
                    workspace.bmh_workspace_id,
                    'hard-limit',
                    workspace['hard-limit']
                  )
                }
              >
                {editingCell?.id === workspace.bmh_workspace_id &&
                editingCell.field === 'hard-limit' ? (
                  <input
                    type="number"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onBlur={() => validateAndSave(workspace)}
                    onKeyDown={(e) => handleKeyDown(e, workspace)}
                    className="w-full px-2 py-1 border border-blue-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    autoFocus
                  />
                ) : (
                  formatDollar(workspace['hard-limit'])
                )}
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
