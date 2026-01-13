import { Workspace, WorkspaceLimits } from '../types/workspace.types';

/**
 * Fetch all workspaces from the API
 */
export async function getWorkspaces(): Promise<Workspace[]> {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_GW_ENDPOINT}/workspaces`,
    {
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': process.env.NEXT_PUBLIC_API_KEY!,
      },
      cache: 'no-store', // Always get fresh data
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch workspaces: ${response.statusText}`);
  }

  const data = await response.json();
  return data as Workspace[];
}

/**
 * Update workspace limits
 */
export async function setWorkspaceLimits(
  workspaceId: string,
  limits: WorkspaceLimits
): Promise<void> {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_GW_ENDPOINT}/workspaces/${workspaceId}/limits`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': process.env.NEXT_PUBLIC_API_KEY!,
      },
      body: JSON.stringify(limits),
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to update workspace limits: ${response.statusText}`);
  }
}
