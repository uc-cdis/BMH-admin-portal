import React from 'react';
import { fireEvent, waitFor, within } from '@testing-library/react';
import { render, screen } from '@/test-utils';
import '@testing-library/jest-dom';
import WorkspaceAccountsAdminClient from '../workspace-accounts-admin-client';
import { getAdminWorkspaces, approveWorkspace, RequestStatus } from '@/lib/api/workspace-api';

// ─── Mocks ───────────────────────────────────────────────────────────────────

jest.mock('@/lib/api/workspace-api', () => ({
  getAdminWorkspaces: jest.fn(),
  approveWorkspace: jest.fn(),
}));

jest.mock('../protected-route', () => ({
  ProtectedRoute: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock('@/components/sortable-header', () => ({
  SortableHeader: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
  BoldHeader: ({ children }: { children: React.ReactNode }) => <strong>{children}</strong>,
}));

// ─── Fixtures ─────────────────────────────────────────────────────────────────
const activeStatus: RequestStatus = 'active'
const pendingStatus: RequestStatus = 'pending'
const mockWorkspaces = [
  {
    bmh_workspace_id: 'ws-001',
    user_id: 'user-a@example.com',
    account_id: '123456789012',
    request_status: activeStatus,
    workspace_type: 'STRIDES Credits',
    'total-usage': 400,
    'soft-limit': 800,
    'hard-limit': 900,
    'strides-credits': 1000,
    root_account_email: 'root-a@example.com',
    ecs: 'ecs-cluster-a',
    subnet: 'subnet-abc',
    scientific_poc: 'Dr. Smith',
  },
  {
    bmh_workspace_id: 'ws-002',
    user_id: 'user-b@example.com',
    account_id: undefined,
    request_status: pendingStatus,
    workspace_type: 'Direct Pay',
    'total-usage': undefined,
    'soft-limit': undefined,
    'hard-limit': undefined,
    direct_pay_limit: 2000,
    root_account_email: '',
    ecs: '',
    subnet: '',
    scientific_poc: '',
  },
  {
    bmh_workspace_id: 'ws-003',
    user_id: 'user-c@example.com',
    account_id: '999888777666',
    request_status: activeStatus,
    workspace_type: 'Trial Workspace',
    'total-usage': 0,
    'soft-limit': 300,
    'hard-limit': 500,
    'strides-credits': 500,
    root_account_email: 'root-c@example.com',
    ecs: '',
    subnet: '',
    scientific_poc: '',
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const mockedGetAdminWorkspaces = getAdminWorkspaces as jest.MockedFunction<typeof getAdminWorkspaces>;
const mockedApproveWorkspace = approveWorkspace as jest.MockedFunction<typeof approveWorkspace>;

function setup() {
  return render(<WorkspaceAccountsAdminClient />);
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('WorkspaceAccountsAdminClient', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedGetAdminWorkspaces.mockResolvedValue([...mockWorkspaces]);
    mockedApproveWorkspace.mockResolvedValue(undefined);
  });

  describe('Loading state', () => {
    it('shows a loading spinner while data is being fetched', () => {
      // Never resolve so we stay in loading state
      mockedGetAdminWorkspaces.mockReturnValue(new Promise(() => {}));
      setup();
      expect(screen.getByText(/loading workspace accounts/i)).toBeInTheDocument();
    });

    it('hides the spinner once data has loaded', async () => {
      setup();
      await waitFor(() =>
        expect(screen.queryByText(/loading workspace accounts/i)).not.toBeInTheDocument()
      );
    });
  });

  describe('Table rendering', () => {
    it('renders the page title', async () => {
      setup();
      await waitFor(() =>
        expect(screen.getByText(/workspace accounts administration/i)).toBeInTheDocument()
      );
    });

    it('renders the warning alert', async () => {
      setup();
      await waitFor(() =>
        expect(screen.getByText(/a process is kicked off in the backend/i)).toBeInTheDocument()
      );
    });

    it('renders all workspace rows', async () => {
      setup();
      await waitFor(() => {
        expect(screen.getByText('user-a@example.com')).toBeInTheDocument();
        expect(screen.getByText('user-b@example.com')).toBeInTheDocument();
        expect(screen.getByText('user-c@example.com')).toBeInTheDocument();
      });
    });

    it('shows "No active workspaces" when the API returns an empty array', async () => {
      mockedGetAdminWorkspaces.mockResolvedValue([]);
      setup();
      await waitFor(() =>
        expect(screen.getByText(/no active workspaces to view/i)).toBeInTheDocument()
      );
    });

    it('shows an empty table body when API call fails', async () => {
      mockedGetAdminWorkspaces.mockRejectedValue(new Error('Network error'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      setup();
      await waitFor(() =>
        expect(screen.getByText(/no active workspaces to view/i)).toBeInTheDocument()
      );
      consoleSpy.mockRestore();
    });

    it('capitalises the first letter of request_status', async () => {
      setup();
      await waitFor(() => {
        // "active" → "Active", "pending" → "Pending"
        expect(screen.getAllByText('Active').length).toBeGreaterThan(0);
        expect(screen.getByText('Pending')).toBeInTheDocument();
      });
    });

    it('displays dollar-prefixed usage values', async () => {
      setup();
      await waitFor(() => {
        // $500 appears in multiple cells (total-usage and possibly soft-limit columns)
        expect(screen.getAllByText('$500').length).toBeGreaterThan(0);
      });
    });

    it('renders Total Funds from direct_pay_limit for Direct Pay workspaces', async () => {
      setup();
      await waitFor(() => {
        expect(screen.getByText('$2000')).toBeInTheDocument();
      });
    });

    it('renders Total Funds from strides-credits for non-Direct Pay workspaces', async () => {
      setup();
      await waitFor(() => {
        expect(screen.getByText('$1000')).toBeInTheDocument();
      });
    });
  });

  describe('Editable Account ID cell', () => {
    it('renders a pencil icon edit button for non-Trial workspaces', async () => {
      setup();
      await waitFor(() => screen.getByText('user-a@example.com'));

      // ws-001 is STRIDES Credits → should have an edit button
      const rows = screen.getAllByRole('row');
      // row[0] = header, row[1] = ws-001
      const editButtons = within(rows[1]).getAllByRole('button');
      expect(editButtons.length).toBeGreaterThan(0);
    });

    it('does NOT render an edit button for Trial Workspace rows', async () => {
      setup();
      await waitFor(() => screen.getByText('user-c@example.com'));

      // ws-003 is Trial Workspace
      const rows = screen.getAllByRole('row');
      // Find the row for user-c
      const trialRow = rows.find((r) => within(r).queryByText('user-c@example.com'));
      expect(trialRow).toBeTruthy();
      expect(within(trialRow!).queryByRole('button')).not.toBeInTheDocument();
    });

    it('shows a text input when the edit button is clicked', async () => {
      setup();
      await waitFor(() => screen.getByText('user-a@example.com'));

      const rows = screen.getAllByRole('row');
      const editButton = within(rows[1]).getByRole('button');
      fireEvent.click(editButton);

      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('pre-populates the text input with the current account ID', async () => {
      setup();
      await waitFor(() => screen.getByText('user-a@example.com'));

      const rows = screen.getAllByRole('row');
      const editButton = within(rows[1]).getByRole('button');
      fireEvent.click(editButton);

      expect(screen.getByRole('textbox')).toHaveValue('123456789012');
    });

    it('cancels editing on Escape without opening the modal', async () => {
      setup();
      await waitFor(() => screen.getByText('user-a@example.com'));

      const rows = screen.getAllByRole('row');
      fireEvent.click(within(rows[1]).getByRole('button'));

      const input = screen.getByRole('textbox');
      fireEvent.keyDown(input, { key: 'Escape' });

      expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
      expect(screen.queryByText(/confirm workspace approval/i)).not.toBeInTheDocument();
    });

    it('does not open the confirmation modal if the value is unchanged on blur', async () => {
      setup();
      await waitFor(() => screen.getByText('user-a@example.com'));

      const rows = screen.getAllByRole('row');
      fireEvent.click(within(rows[1]).getByRole('button'));

      // Blur without changing the value
      fireEvent.blur(screen.getByRole('textbox'));

      expect(screen.queryByText(/confirm workspace approval/i)).not.toBeInTheDocument();
    });
  });

  describe('API interactions', () => {
    it('calls getAdminWorkspaces once on mount', async () => {
      setup();
      await waitFor(() => expect(mockedGetAdminWorkspaces).toHaveBeenCalledTimes(1));
    });

    it('sorts the initial workspace list by user_id ascending', async () => {
      // Provide data out of order
      const unordered = [mockWorkspaces[2], mockWorkspaces[0], mockWorkspaces[1]];
      mockedGetAdminWorkspaces.mockResolvedValue(unordered);

      setup();
      await waitFor(() => screen.getByText('user-a@example.com'));

      const rows = screen.getAllByRole('row');
      // Skip header row; rows[1] should be user-a
      expect(within(rows[1]).getByText('user-a@example.com')).toBeInTheDocument();
      expect(within(rows[2]).getByText('user-b@example.com')).toBeInTheDocument();
      expect(within(rows[3]).getByText('user-c@example.com')).toBeInTheDocument();
    });
  });
});
