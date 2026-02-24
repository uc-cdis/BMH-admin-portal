'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Container,
  Title,
  Text,
  Button,
  Group,
  Stack,
  Alert,
  Loader,
  Center,
  Paper,
  ActionIcon,
  TextInput,
  Table,
} from '@mantine/core';
import { IconPencil, IconAlertTriangle } from '@tabler/icons-react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table';
import { getWorkspaces, setWorkspaceLimits, Workspace } from '@/lib/api/workspace-api';
import { authorizeAdmin } from '@/lib/auth/authorization';
import { SortableHeader, BoldHeader } from '@/components/sortable-header';
import { ProtectedRoute } from './protected-route';


function WorkspaceAccountsContent() {
  const [stridesWorkspaces, setStridesWorkspaces] = useState<Workspace[]>([]);
  const [occWorkspaces, setOccWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [adminAuthorized, setAdminAuthorized] = useState(false);
  const [stridesSorting, setStridesSorting] = useState<SortingState>([]);
  const [directPaySorting, setDirectPaySorting] = useState<SortingState>([]);
  const [editingCell, setEditingCell] = useState<{
    rowId: string;
    columnId: string;
    value: string;
  } | null>(null);

  const workspaceLink = process.env.NEXT_PUBLIC_OIDC_AUTH_URI
    ? `https://${new URL(process.env.NEXT_PUBLIC_OIDC_AUTH_URI).host}/workspace`
    : '/workspace';

  useEffect(() => {
    async function loadData() {
      setLoading(true);

      try {
        // Check admin authorization
        const isAdmin = await authorizeAdmin();
        setAdminAuthorized(isAdmin);

        // Get workspaces
        const data = await getWorkspaces();

        // Separate STRIDES and OCC workspaces
        const occData: Workspace[] = [];
        const stridesData: Workspace[] = [];

        data.forEach((workspace: any) => {
          if (workspace.workspace_type === 'Direct Pay') {
            occData.push(workspace);
          } else {
            stridesData.push(workspace);
          }
        });

        setStridesWorkspaces(stridesData);
        setOccWorkspaces(occData);
      } catch (error) {
        console.error('Error loading workspaces:', error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  // Handle cell edit
  const handleCellEdit = async (
    workspaceId: string,
    field: 'soft-limit' | 'hard-limit',
    newValue: string
  ) => {
    const workspace = [...stridesWorkspaces, ...occWorkspaces].find(
      (w) => w.bmh_workspace_id === workspaceId
    );

    if (!workspace) return;

    const numValue = parseInt(newValue);

    // Validation
    if (field === 'soft-limit') {
      if (numValue >= (workspace['hard-limit'] || 0)) {
        alert('Soft limit must be less than hard limit.');
        return;
      }
      if (numValue <= 0) {
        alert('Soft limit must be greater than 0.');
        return;
      }
    } else if (field === 'hard-limit') {
      if (numValue <= (workspace['soft-limit'] || 0)) {
        alert('Hard limit must be greater than soft limit.');
        return;
      }
      if (
        workspace['strides-credits'] &&
        workspace['strides-credits'] !== 0 &&
        numValue > workspace['strides-credits']
      ) {
        alert('Hard limit must be less than or equal to STRIDES Credits amount.');
        return;
      }
    }

    try {
      const limits = {
        'hard-limit': field === 'hard-limit' ? numValue : workspace['hard-limit'],
        'soft-limit': field === 'soft-limit' ? numValue : workspace['soft-limit'],
      };

      await setWorkspaceLimits(workspaceId, limits);

      // Update local state
      const updateWorkspace = (ws: Workspace) =>
        ws.bmh_workspace_id === workspaceId ? { ...ws, [field]: numValue } : ws;

      setStridesWorkspaces((prev) => prev.map(updateWorkspace));
      setOccWorkspaces((prev) => prev.map(updateWorkspace));

      setEditingCell(null);
    } catch (error) {
      console.error('Error updating limits:', error);
      alert('Failed to update limit. Please try again.');
    }
  };

  // Editable cell component
  const EditableCell = ({
    value,
    workspaceId,
    field,
  }: {
    value: number;
    workspaceId: string;
    field: 'soft-limit' | 'hard-limit';
  }) => {
    const isEditing =
      editingCell?.rowId === workspaceId && editingCell?.columnId === field;

    if (isEditing) {
      return (
        <TextInput
          data-testid={`edit-input-${workspaceId}-${field}`}
          value={editingCell.value}
          onChange={(e) =>
            setEditingCell({ ...editingCell, value: e.target.value })
          }
          onBlur={() => {
            if (editingCell.value !== String(value)) {
              handleCellEdit(workspaceId, field, editingCell.value);
            } else {
              setEditingCell(null);
            }
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleCellEdit(workspaceId, field, editingCell.value);
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
        <Text>${value}</Text>
        <ActionIcon
          data-testid={`edit-btn-${workspaceId}-${field}`}
          variant="subtle"
          size="sm"
          onClick={() =>
            setEditingCell({ rowId: workspaceId, columnId: field, value: String(value) })
          }
        >
          <IconPencil size={14} />
        </ActionIcon>
      </Group>
    );
  };

 // STRIDES workspace columns
  const stridesColumns: ColumnDef<Workspace>[] = [
    {
      accessorKey: 'nih_funded_award_number',
      header: ({ column }) => <SortableHeader column={column}>NIH Award/Grant ID</SortableHeader>,
      cell: (info) => info.getValue() || 'N/A',
      enableSorting: false,
    },
    {
      accessorKey: 'request_status',
      header: ({ column }) => <SortableHeader column={column}>Request Status</SortableHeader>,
      cell: (info) => {
        const status = info.getValue() as string;
        return status.charAt(0).toUpperCase() + status.slice(1);
      },
      enableSorting: true,
    },
    {
      accessorKey: 'workspace_type',
      header: ({ column }) => <SortableHeader column={column}>Workspace Type</SortableHeader>,
      enableSorting: true,
    },
    {
      accessorKey: 'total-usage',
      header: ({ column }) => <SortableHeader column={column}>Total Usage</SortableHeader>,
      cell: (info) => `$${info.getValue()}`,
      enableSorting: true,
    },
    {
      accessorKey: 'strides-credits',
      header: () => <BoldHeader>STRIDES Credits</BoldHeader>,
      cell: (info) => `$${info.getValue() || 0}`,
      enableSorting: false,
    },
    {
      accessorKey: 'soft-limit',
      header: () => (
        <Group gap="xs">
          <BoldHeader>Soft Limit</BoldHeader>
          <IconPencil size={14} />
        </Group>
      ),
      cell: (info) => (
        <EditableCell
          value={info.getValue() as number}
          workspaceId={info.row.original.bmh_workspace_id}
          field="soft-limit"
        />
      ),
      enableSorting: false,
    },
    {
      accessorKey: 'hard-limit',
      header: () => (
        <Group gap="xs">
          <BoldHeader>Hard Limit</BoldHeader>
          <IconPencil size={14} />
        </Group>
      ),
      cell: (info) => (
        <EditableCell
          value={info.getValue() as number}
          workspaceId={info.row.original.bmh_workspace_id}
          field="hard-limit"
        />
      ),
      enableSorting: false,
    },
    {
      id: 'access-link',
      header: () => <BoldHeader>Workspaces Link</BoldHeader>,
      cell: () => (
        <a
          href={workspaceLink}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:text-blue-800 underline"
        >
          Link
        </a>
      ),
      enableSorting: false,
    },
  ];

  // Direct Pay workspace columns
  const directPayColumns: ColumnDef<Workspace>[] = [
    {
      accessorKey: 'bmh_workspace_id',
      header: ({ column }) => <SortableHeader column={column}>OCC Request ID</SortableHeader>,
      enableSorting: true,
    },
    {
      accessorKey: 'request_status',
      header: ({ column }) => <SortableHeader column={column}>Request Status</SortableHeader>,
      cell: (info) => {
        const status = info.getValue() as string;
        return status.charAt(0).toUpperCase() + status.slice(1);
      },
      enableSorting: true,
    },
    {
      accessorKey: 'workspace_type',
      header: ({ column }) => <SortableHeader column={column}>Workspace Type</SortableHeader>,
      enableSorting: true,
    },
    {
      accessorKey: 'total-usage',
      header: ({ column }) => <SortableHeader column={column}>Total Usage</SortableHeader>,
      cell: (info) => `$${info.getValue()}`,
      enableSorting: true,
    },
    {
      accessorKey: 'direct_pay_limit',
      header: () => <BoldHeader>Compute Purchased</BoldHeader>,
      cell: (info) => `$${info.getValue() || ''}`,
      enableSorting: false,
    },
    {
      accessorKey: 'soft-limit',
      header: () => <BoldHeader>Soft Limit</BoldHeader>,
      cell: (info) => `$${info.getValue() || ''}`,
      enableSorting: false,
    },
    {
      accessorKey: 'hard-limit',
      header: () => <BoldHeader>Hard Limit</BoldHeader>,
      cell: (info) => `$${info.getValue() || ''}`,
      enableSorting: false,
    },
    {
      id: 'access-link',
      header: () => <BoldHeader>Workspaces Link</BoldHeader>,
      cell: () => (
        <a
          href={workspaceLink}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:text-blue-800 underline"
        >
          Link
        </a>
      ),
      enableSorting: false,
    },
  ];

  const stridesTable = useReactTable({
    data: stridesWorkspaces,
    columns: stridesColumns,
    state: { sorting: stridesSorting },
    onSortingChange: setStridesSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const directPayTable = useReactTable({
    data: occWorkspaces,
    columns: directPayColumns,
    state: { sorting: directPaySorting },
    onSortingChange: setDirectPaySorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  if (loading) {
    return (
      <Container size="xl" py="xl">
        <Center style={{ minHeight: '400px' }}>
          <Stack align="center" gap="md">
            <Loader size="lg" />
            <Text c="dimmed">Loading workspace accounts...</Text>
          </Stack>
        </Center>
      </Container>
    );
  }

  return (
    <Container size="xl" py="xl">
      <Stack gap="xl">
        {/* STRIDES Credit Workspaces */}
        <Stack gap="md">
          <Title order={2} ta="center">
            STRIDES Credit Workspace Accounts
          </Title>

          <Paper shadow="sm" p="md" withBorder>
            <div className="overflow-x-auto">
              <Table striped highlightOnHover withTableBorder>
                <Table.Thead>
                  {stridesTable.getHeaderGroups().map((headerGroup) => (
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
                  {stridesTable.getRowModel().rows.length === 0 ? (
                    <Table.Tr>
                      <Table.Td colSpan={stridesColumns.length}>
                        <Text ta="center" c="dimmed" py="xl">
                          No active workspace accounts to view.
                        </Text>
                      </Table.Td>
                    </Table.Tr>
                  ) : (
                    stridesTable.getRowModel().rows.map((row) => (
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

          <Alert
            icon={<IconAlertTriangle size="1rem" />}
            title="Warning"
            color="orange"
            variant="light"
          >
            <Text size="sm">
              <strong>Warning:</strong> When a Workspace reaches the STRIDES Credits limit
              (for STRIDES Credits Workspaces) or reaches the Hard Limit (for STRIDES Grant
              Workspaces), the Workspace will be automatically terminated. Please be sure to
              save any work before reaching the STRIDES Credit or Hard Limit.
            </Text>
          </Alert>
        </Stack>

        {/* OCC Direct Pay Workspaces */}
        <Stack gap="md">
          <Title order={2} ta="center">
            OCC Direct Pay Workspace Accounts
          </Title>

          <Paper shadow="sm" p="md" withBorder>
            <div className="overflow-x-auto">
              <Table striped highlightOnHover withTableBorder>
                <Table.Thead>
                  {directPayTable.getHeaderGroups().map((headerGroup) => (
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
                  {directPayTable.getRowModel().rows.length === 0 ? (
                    <Table.Tr>
                      <Table.Td colSpan={directPayColumns.length}>
                        <Text ta="center" c="dimmed" py="xl">
                          No active workspace accounts to view.
                        </Text>
                      </Table.Td>
                    </Table.Tr>
                  ) : (
                    directPayTable.getRowModel().rows.map((row) => (
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

          <Alert
            icon={<IconAlertTriangle size="1rem" />}
            title="Warning"
            color="orange"
            variant="light"
          >
            <Text size="sm">
              <strong>Warning:</strong> When a Workspace reaches the soft limit, OCC will
              send an email requesting more funds be added to your account. If it reaches the
              hard limit and further payment is not processed, the workspace will automatically
              be terminated. Please be sure to save any work before reaching the Hard Limit.
            </Text>
          </Alert>
        </Stack>

        {/* Action Buttons */}
        <Group justify="center" mt="xl">
          <Button
            component={Link}
            href="/request-workspace"
            size="lg"
            variant="filled"
          >
            Request New Workspace Account
          </Button>

          {adminAuthorized && (
            <Button
              component={Link}
              href="/admin"
              size="lg"
              variant="filled"
              color="yellow"
            >
              Administrate Workspace Accounts
            </Button>
          )}
        </Group>
      </Stack>
    </Container>
  );
}

export default function WorkspaceAccountsClient() {
  return (
    <ProtectedRoute>
      <WorkspaceAccountsContent />
    </ProtectedRoute>
  );
}
