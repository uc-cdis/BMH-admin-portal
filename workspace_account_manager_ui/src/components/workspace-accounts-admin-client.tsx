'use client';

import { useState, useEffect } from 'react';
import {
  Container,
  Title,
  Text,
  Alert,
  Loader,
  Center,
  Stack,
  Paper,
  ActionIcon,
  TextInput,
  Table,
  Modal,
  Button,
  Group,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconPencil, IconSortAscending, IconAlertTriangle } from '@tabler/icons-react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table';
import { getAdminWorkspaces, approveWorkspace, Workspace } from '@/lib/api/workspace-api';
import { authorizeAdmin } from '@/lib/auth/authorization';


const DIRECT_PAY = 'Direct Pay';

export default function WorkspaceAccountsAdminClient() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [adminAuthorized, setAdminAuthorized] = useState(false);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [editingCell, setEditingCell] = useState<{
    rowId: string;
    value: string;
  } | null>(null);
  const [confirmModalOpened, { open: openConfirmModal, close: closeConfirmModal }] = useDisclosure(false);
  const [pendingApproval, setPendingApproval] = useState<{
    workspaceId: string;
    accountId: string;
  } | null>(null);

  useEffect(() => {
    async function loadData() {
      setLoading(true);

      try {
        // Check admin authorization
        const isAdmin = await authorizeAdmin();
        setAdminAuthorized(isAdmin);

        if (!isAdmin) {
          setLoading(false);
          return;
        }

        // Get all workspaces
        const data = await getAdminWorkspaces();

        // Sort by user_id
        data.sort((a: any, b: any) => {
          const aId = a.user_id;
          const bId = b.user_id;
          if (aId < bId) return -1;
          if (aId > bId) return 1;
          return 0;
        });

        setWorkspaces(data);
      } catch (error) {
        console.error('Error loading admin workspaces:', error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  // Handle account ID edit and approval
  const handleAccountIdEdit = (workspaceId: string, newAccountId: string) => {
    setPendingApproval({ workspaceId, accountId: newAccountId });
    openConfirmModal();
  };

  const handleConfirmApproval = async () => {
    if (!pendingApproval) return;

    try {
      const account = {
        account_id: pendingApproval.accountId,
      };

      await approveWorkspace(pendingApproval.workspaceId, account);

      // Update local state
      setWorkspaces((prev) =>
        prev.map((ws) =>
          ws.bmh_workspace_id === pendingApproval.workspaceId
            ? { ...ws, account_id: pendingApproval.accountId }
            : ws
        )
      );

      closeConfirmModal();
      setEditingCell(null);
      setPendingApproval(null);
    } catch (error) {
      console.error('Error approving workspace:', error);
      alert('Failed to approve workspace. Please try again.');
    }
  };

  const handleCancelApproval = () => {
    closeConfirmModal();
    setEditingCell(null);
    setPendingApproval(null);
  };

  // Editable Account ID cell
  const EditableAccountCell = ({
    value,
    workspaceId,
  }: {
    value?: string;
    workspaceId: string;
  }) => {
    const isEditing = editingCell?.rowId === workspaceId;

    if (isEditing) {
      return (
        <TextInput
          value={editingCell.value}
          onChange={(e) => setEditingCell({ ...editingCell, value: e.target.value })}
          onBlur={() => {
            if (editingCell.value !== (value || '')) {
              handleAccountIdEdit(workspaceId, editingCell.value);
            } else {
              setEditingCell(null);
            }
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleAccountIdEdit(workspaceId, editingCell.value);
            } else if (e.key === 'Escape') {
              setEditingCell(null);
            }
          }}
          autoFocus
          size="xs"
        />
      );
    }

    return (
      <Group gap="xs" justify="space-between">
        <Text size="sm">{value || '-'}</Text>
        <ActionIcon
          variant="subtle"
          size="sm"
          onClick={() => setEditingCell({ rowId: workspaceId, value: value || '' })}
        >
          <IconPencil size={14} />
        </ActionIcon>
      </Group>
    );
  };

  // Column definitions
  const columns: ColumnDef<Workspace>[] = [
    {
      accessorKey: 'user_id',
      header: () => (
        <Group gap="xs">
          <Text>User ID</Text>
          <IconSortAscending size={14} />
        </Group>
      ),
      cell: (info) => <Text size="sm">{info.getValue() as string}</Text>,
    },
    {
      accessorKey: 'account_id',
      header: () => (
        <Group gap="xs">
          <Text>AWS Account</Text>
          <IconPencil size={14} />
        </Group>
      ),
      cell: (info) => (
        <EditableAccountCell
          value={info.getValue() as string | undefined}
          workspaceId={info.row.original.bmh_workspace_id}
        />
      ),
    },
    {
      accessorKey: 'request_status',
      header: () => (
        <Group gap="xs">
          <Text>Request Status</Text>
          <IconSortAscending size={14} />
        </Group>
      ),
      cell: (info) => {
        const status = info.getValue() as string;
        return (
          <Text size="sm">{status.charAt(0).toUpperCase() + status.slice(1)}</Text>
        );
      },
    },
    {
      accessorKey: 'workspace_type',
      header: () => (
        <Group gap="xs">
          <Text>Workspace Type</Text>
          <IconSortAscending size={14} />
        </Group>
      ),
      cell: (info) => <Text size="sm">{info.getValue() as string}</Text>,
    },
    {
      accessorKey: 'total-usage',
      header: () => (
        <Group gap="xs">
          <Text>Total Usage</Text>
          <IconSortAscending size={14} />
        </Group>
      ),
      cell: (info) => {
        const value = info.getValue() as number | undefined;
        return <Text size="sm">{value !== undefined ? `$${value}` : ''}</Text>;
      },
    },
    {
      accessorKey: 'soft-limit',
      header: () => (
        <Group gap="xs">
          <Text>Soft Limit</Text>
          <IconSortAscending size={14} />
        </Group>
      ),
      cell: (info) => {
        const value = info.getValue() as number | undefined;
        return <Text size="sm">{value !== undefined ? `$${value}` : ''}</Text>;
      },
    },
    {
      accessorKey: 'hard-limit',
      header: () => (
        <Group gap="xs">
          <Text>Hard Limit</Text>
          <IconSortAscending size={14} />
        </Group>
      ),
      cell: (info) => {
        const value = info.getValue() as number | undefined;
        return <Text size="sm">{value !== undefined ? `$${value}` : ''}</Text>;
      },
    },
    {
      id: 'total-funds',
      header: () => (
        <Group gap="xs">
          <Text>Total Funds</Text>
          <IconSortAscending size={14} />
        </Group>
      ),
      cell: (info) => {
        const row = info.row.original;
        let value: number | undefined;

        if (row.workspace_type === DIRECT_PAY && row.direct_pay_limit !== undefined) {
          value = row.direct_pay_limit;
        } else if (row['strides-credits'] !== undefined) {
          value = row['strides-credits'];
        }

        return <Text size="sm">{value !== undefined ? `$${value}` : ''}</Text>;
      },
    },
    {
      accessorKey: 'root_account_email',
      header: () => (
        <Group gap="xs">
          <Text>Root Email</Text>
          <IconSortAscending size={14} />
        </Group>
      ),
      cell: (info) => <Text size="sm">{(info.getValue() as string) || ''}</Text>,
    },
    {
      accessorKey: 'ecs',
      header: () => (
        <Group gap="xs">
          <Text>ECS</Text>
          <IconSortAscending size={14} />
        </Group>
      ),
      cell: (info) => <Text size="sm">{(info.getValue() as string) || ''}</Text>,
    },
    {
      accessorKey: 'subnet',
      header: () => (
        <Group gap="xs">
          <Text>Subnet</Text>
          <IconSortAscending size={14} />
        </Group>
      ),
      cell: (info) => <Text size="sm">{(info.getValue() as string) || ''}</Text>,
    },
    {
      accessorKey: 'scientific_poc',
      header: () => (
        <Group gap="xs">
          <Text>Scientific POC</Text>
          <IconSortAscending size={14} />
        </Group>
      ),
      cell: (info) => <Text size="sm">{(info.getValue() as string) || ''}</Text>,
    },
  ];

  const table = useReactTable({
    data: workspaces,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  if (loading) {
    return (
      <Container size="xl" py="xl">
        <Center style={{ minHeight: '400px' }}>
          <Stack align="center" gap="md">
            <Loader size="lg" />
            <Text c="dimmed">Loading admin workspaces...</Text>
          </Stack>
        </Center>
      </Container>
    );
  }

  if (!adminAuthorized) {
    return (
      <Container size="xl" py="xl">
        <Alert
          icon={<IconAlertTriangle size="1rem" />}
          title="Access Denied"
          color="red"
          variant="light"
        >
          You do not have permission to access the admin workspace management page.
        </Alert>
      </Container>
    );
  }

  return (
    <Container size="xl" py="xl">
      <Stack gap="xl">
        <Stack gap="md">
          <Title order={2} ta="center">
            Workspace Accounts Administration
          </Title>

          <Alert
            icon={<IconAlertTriangle size="1rem" />}
            title="Warning"
            color="orange"
            variant="light"
          >
            <Text size="sm">
              <strong>Warning:</strong> When you fill out the AWS Account ID for a pending
              request, a process is kicked off in the backend to deploy cost tracking
              infrastructure to that account. Make sure you don&apos;t have any typos in the account
              ID and that it matches the request. This will only work for pending, failed or
              erroneous requests. Requests that are in active or provisioning state will not
              have any effect. To change the account ID of an existing row please contact the
              platform team.
            </Text>
          </Alert>
        </Stack>

        <Paper shadow="sm" p="md" withBorder>
          <div className="overflow-x-auto">
            <Table striped highlightOnHover withTableBorder>
              <Table.Thead>
                {table.getHeaderGroups().map((headerGroup) => (
                  <Table.Tr key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <Table.Th
                        key={header.id}
                        style={{ cursor: header.column.getCanSort() ? 'pointer' : 'default' }}
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </Table.Th>
                    ))}
                  </Table.Tr>
                ))}
              </Table.Thead>
              <Table.Tbody>
                {table.getRowModel().rows.length === 0 ? (
                  <Table.Tr>
                    <Table.Td colSpan={columns.length}>
                      <Text ta="center" c="dimmed" py="xl">
                        No active workspaces to view.
                      </Text>
                    </Table.Td>
                  </Table.Tr>
                ) : (
                  table.getRowModel().rows.map((row) => (
                    <Table.Tr key={row.id}>
                      {row.getVisibleCells().map((cell) => (
                        <Table.Td key={cell.id}>
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </Table.Td>
                      ))}
                    </Table.Tr>
                  ))
                )}
              </Table.Tbody>
            </Table>
          </div>
        </Paper>
      </Stack>

      {/* Confirmation Modal */}
      <Modal
        opened={confirmModalOpened}
        onClose={handleCancelApproval}
        title="Confirm Workspace Approval"
        centered
      >
        <Stack gap="md">
          <Text>
            Do you want to approve this workspace with the following AWS Account ID?
          </Text>
          <Text fw={700} size="lg">
            {pendingApproval?.accountId}
          </Text>
          <Text size="sm" c="dimmed">
            This will trigger the backend process to deploy cost tracking infrastructure to
            this account. Make sure the account ID is correct.
          </Text>
          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={handleCancelApproval}>
              Cancel
            </Button>
            <Button color="blue" onClick={handleConfirmApproval}>
              Confirm Approval
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Container>
  );
}
