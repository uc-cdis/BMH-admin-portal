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
import { IconPencil, IconAlertTriangle } from '@tabler/icons-react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table';
import { getAdminWorkspaces, approveWorkspace, Workspace } from '@/lib/api/workspace-api';
import { SortableHeader, BoldHeader } from '@/components/sortable-header';
import { ProtectedRoute } from './protected-route';

const DIRECT_PAY = 'Direct Pay';

function WorkspaceAccountsAdminContent() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
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
    workspaceType,
  }: {
    value?: string;
    workspaceId: string;
    workspaceType: string;
  }) => {
    const isEditing = editingCell?.rowId === workspaceId;

    if (workspaceType === 'Trial Workspace') {
      return <Text size="sm">{value || '-'}</Text>;
    }

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

  const columns: ColumnDef<Workspace>[] = [
    {
      accessorKey: 'user_id',
      header: ({ column }) => <SortableHeader column={column}>User ID</SortableHeader>,
      cell: (info) => <Text size="sm">{info.getValue() as string}</Text>,
      enableSorting: true,
    },
    {
      accessorKey: 'account_id',
      header: () => (
        <Group gap="xs">
          <BoldHeader>AWS Account</BoldHeader>
          <IconPencil size={14} />
        </Group>
      ),
      cell: (info) => (
        <EditableAccountCell
          value={info.getValue() as string | undefined}
          workspaceId={info.row.original.bmh_workspace_id}
          workspaceType={info.row.original.workspace_type}
        />
      ),
      enableSorting: false,
    },
    {
      accessorKey: 'request_status',
      header: ({ column }) => <SortableHeader column={column}>Request Status</SortableHeader>,
      cell: (info) => {
        const status = info.getValue() as string;
        return (
          <Text size="sm">{status.charAt(0).toUpperCase() + status.slice(1)}</Text>
        );
      },
      enableSorting: true,
    },
    {
      accessorKey: 'workspace_type',
      header: ({ column }) => <SortableHeader column={column}>Workspace Type</SortableHeader>,
      cell: (info) => <Text size="sm">{info.getValue() as string}</Text>,
      enableSorting: true,
    },
    {
      accessorKey: 'total-usage',
      header: ({ column }) => <SortableHeader column={column}>Total Usage</SortableHeader>,
      cell: (info) => {
        const value = info.getValue() as number | undefined;
        return <Text size="sm">{value !== undefined ? `$${value}` : ''}</Text>;
      },
      enableSorting: true,
    },
    {
      accessorKey: 'soft-limit',
      header: ({ column }) => <SortableHeader column={column}>Soft Limit</SortableHeader>,
      cell: (info) => {
        const value = info.getValue() as number | undefined;
        return <Text size="sm">{value !== undefined ? `$${value}` : ''}</Text>;
      },
      enableSorting: true,
    },
    {
      accessorKey: 'hard-limit',
      header: ({ column }) => <SortableHeader column={column}>Hard Limit</SortableHeader>,
      cell: (info) => {
        const value = info.getValue() as number | undefined;
        return <Text size="sm">{value !== undefined ? `$${value}` : ''}</Text>;
      },
      enableSorting: true,
    },
    {
      id: 'total-funds',
      header: ({ column }) => <SortableHeader column={column}>Total Funds</SortableHeader>,
      accessorFn: (row) => {
        if (row.workspace_type === DIRECT_PAY && row.direct_pay_limit !== undefined) {
          return row.direct_pay_limit;
        } else if (row['strides-credits'] !== undefined) {
          return row['strides-credits'];
        }
        return 0;
      },
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
      enableSorting: true,
    },
    {
      accessorKey: 'root_account_email',
      header: ({ column }) => <SortableHeader column={column}>Root Email</SortableHeader>,
      cell: (info) => <Text size="sm">{(info.getValue() as string) || ''}</Text>,
      enableSorting: true,
    },
    {
      accessorKey: 'ecs',
      header: ({ column }) => <SortableHeader column={column}>ECS</SortableHeader>,
      cell: (info) => <Text size="sm">{(info.getValue() as string) || ''}</Text>,
      enableSorting: true,
    },
    {
      accessorKey: 'subnet',
      header: ({ column }) => <SortableHeader column={column}>Subnet</SortableHeader>,
      cell: (info) => <Text size="sm">{(info.getValue() as string) || ''}</Text>,
      enableSorting: true,
    },
    {
      accessorKey: 'scientific_poc',
      header: ({ column }) => <SortableHeader column={column}>Scientific POC</SortableHeader>,
      cell: (info) => <Text size="sm">{(info.getValue() as string) || ''}</Text>,
      enableSorting: true,
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
            <Text c="dimmed">Loading workspace accounts administration page...</Text>
          </Stack>
        </Center>
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

export default function WorkspaceAccountsAdminClient() {
  return (
    <ProtectedRoute requireAdmin>
      <WorkspaceAccountsAdminContent />
    </ProtectedRoute>
  );
}
