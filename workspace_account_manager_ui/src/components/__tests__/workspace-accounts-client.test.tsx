import React from 'react';
import { waitFor, fireEvent, within } from '@testing-library/react';
import { render, screen } from '@/test-utils';
import userEvent from '@testing-library/user-event';
import WorkspaceAccountsClient from '../workspace-accounts-client';
import { getWorkspaces, setWorkspaceLimits } from '@/lib/api/workspace-api';
import { authorizeAdmin } from '@/lib/auth/authorization';

// ─── Mocks ───────────────────────────────────────────────────────────────────

jest.mock('@/lib/api/workspace-api', () => ({
    getWorkspaces: jest.fn(),
    setWorkspaceLimits: jest.fn(),
}));

jest.mock('@/lib/auth/authorization', () => ({
    authorizeAdmin: jest.fn(),
}));

jest.mock('@/components/protected-route', () => ({
    ProtectedRoute: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock('next/link', () =>
    function MockLink({ href, children }: { href: string; children: React.ReactNode }) {
        return <a href={href}>{children}</a>;
    }
);

// ─── Fixtures ────────────────────────────────────────────────────────────────────

const stridesWorkspace = {
    bmh_workspace_id: 'ws-strides-1',
    workspace_type: 'STRIDES Credits',
    nih_funded_award_number: 'OT2OD123456',
    request_status: 'active',
    'total-usage': 500,
    'strides-credits': 10000,
    'soft-limit': 800,
    'hard-limit': 1000,
};

const directPayWorkspace = {
    bmh_workspace_id: 'ws-dp-1',
    workspace_type: 'Direct Pay',
    nih_funded_award_number: null,
    request_status: 'active',
    'total-usage': 200,
    direct_pay_limit: 5000,
    'soft-limit': 400,
    'hard-limit': 600,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const mockGetWorkspaces = getWorkspaces as jest.MockedFunction<typeof getWorkspaces>;
const mockAuthorizeAdmin = authorizeAdmin as jest.MockedFunction<typeof authorizeAdmin>;
const mockSetWorkspaceLimits = setWorkspaceLimits as jest.MockedFunction<typeof setWorkspaceLimits>;

function setup(workspaces = [stridesWorkspace, directPayWorkspace], isAdmin = false) {
    mockGetWorkspaces.mockResolvedValue(workspaces as any);
    mockAuthorizeAdmin.mockResolvedValue(isAdmin);
    mockSetWorkspaceLimits.mockResolvedValue(undefined as any);
    return render(<WorkspaceAccountsClient />);
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('WorkspaceAccountsClient', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        window.alert = jest.fn();
    });

    describe('loading state', () => {
        it('shows a loading indicator while fetching data', () => {
            // Never resolve so the component stays in loading state
            mockGetWorkspaces.mockReturnValue(new Promise(() => { }));
            mockAuthorizeAdmin.mockReturnValue(new Promise(() => { }));

            render(<WorkspaceAccountsClient />);

            expect(screen.getByText(/loading workspace accounts/i)).toBeInTheDocument();
        });
    });

    describe('after data loads', () => {
        it('renders both table section headings', async () => {
            setup();

            await waitFor(() => {
                expect(screen.getByText('STRIDES Credit Workspace Accounts')).toBeInTheDocument();
                expect(screen.getByText('OCC Direct Pay Workspace Accounts')).toBeInTheDocument();
            });
        });
        it('renders a STRIDES workspace row with correct data', async () => {
            setup();

            await waitFor(() => {
                expect(screen.getByText('OT2OD123456')).toBeInTheDocument();

                const stridesSection = screen.getByText('STRIDES Credit Workspace Accounts')
                    .closest('div');
                expect(stridesSection).not.toBeNull();
                expect(within(stridesSection!).getAllByText('Active')[0]).toBeInTheDocument();
            });
        });

        it('renders the "Request New Workspace Account" button', async () => {
            setup();

            await waitFor(() => {
                const btn = screen.getByRole('link', { name: /request new workspace account/i });
                expect(btn).toBeInTheDocument();
                expect(btn).toHaveAttribute('href', '/request-workspace');
            });
        });

        it('shows the admin button only when authorizeAdmin returns true', async () => {
            setup([stridesWorkspace], true);

            await waitFor(() => {
                expect(
                    screen.getByRole('link', { name: /administrate workspace accounts/i })
                ).toBeInTheDocument();
            });
        });

        it('hides the admin button when the user is not an admin', async () => {
            setup([stridesWorkspace], false);

            await waitFor(() => {
                expect(
                    screen.queryByRole('link', { name: /administrate workspace accounts/i })
                ).not.toBeInTheDocument();
            });
        });

        it('shows empty-state message when there are no workspaces', async () => {
            setup([]);

            await waitFor(() => {
                const emptyMessages = screen.getAllByText(/no active workspace accounts to view/i);
                expect(emptyMessages).toHaveLength(2); // one per table
            });
        });
    });

    describe('inline cell editing', () => {
        it('switches a soft-limit cell into edit mode when the pencil icon is clicked', async () => {
            setup([stridesWorkspace]);

            await waitFor(() => screen.getByText('$800'));

            fireEvent.click(screen.getByTestId('edit-btn-ws-strides-1-soft-limit'));

            await waitFor(() => {
                expect(screen.getByTestId('edit-input-ws-strides-1-soft-limit')).toBeInTheDocument();
            });
        });

        it('calls setWorkspaceLimits with the new value on Enter', async () => {
            const user = userEvent.setup();
            setup([stridesWorkspace]);

            await waitFor(() => screen.getByText('$800'));

            fireEvent.click(screen.getByTestId('edit-btn-ws-strides-1-soft-limit'));

            const input = await screen.findByTestId('edit-input-ws-strides-1-soft-limit');
            await user.clear(input);
            await user.type(input, '900');
            await user.keyboard('{Enter}');

            await waitFor(() => {
                expect(mockSetWorkspaceLimits).toHaveBeenCalledWith('ws-strides-1', {
                    'soft-limit': 900,
                    'hard-limit': 1000,
                });
            });
        });

        it('shows an alert and does NOT call setWorkspaceLimits when soft limit >= hard limit', async () => {
            const user = userEvent.setup();
            setup([stridesWorkspace]);

            await waitFor(() => screen.getByText('$800'));

            fireEvent.click(screen.getByTestId('edit-btn-ws-strides-1-soft-limit'));

            const input = await screen.findByTestId('edit-input-ws-strides-1-soft-limit');
            await user.clear(input);
            await user.type(input, '1000');
            await user.keyboard('{Enter}');

            await waitFor(() => {
                expect(window.alert).toHaveBeenCalledWith('Soft limit must be less than hard limit.');
                expect(mockSetWorkspaceLimits).not.toHaveBeenCalled();
            });
        });

        it('dismisses the editor on Escape without saving', async () => {
            setup([stridesWorkspace]);

            await waitFor(() => screen.getByText('$800'));

            fireEvent.click(screen.getByTestId('edit-btn-ws-strides-1-soft-limit'));

            const input = await screen.findByTestId('edit-input-ws-strides-1-soft-limit');
            fireEvent.keyDown(input, { key: 'Escape' });

            await waitFor(() => {
                expect(screen.queryByTestId('edit-input-ws-strides-1-soft-limit')).not.toBeInTheDocument();
                expect(mockSetWorkspaceLimits).not.toHaveBeenCalled();
            });
        });
    });
});
