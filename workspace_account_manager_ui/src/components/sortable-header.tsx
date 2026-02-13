// components/table/sortable-header.tsx
// Reusable sortable table header component for React Table

import { Group, Text } from '@mantine/core';
import { IconSortAscending, IconSortDescending, IconSelector } from '@tabler/icons-react';
import type { Column } from '@tanstack/react-table';

interface SortableHeaderProps {
  column: Column<any, unknown>;
  children: React.ReactNode;
}

/**
 * Sortable table header component that displays dynamic sort icons
 * based on the current sort state.
 *
 * @param column - The React Table column instance
 * @param children - The header text/content
 *
 * @example
 * ```tsx
 * {
 *   accessorKey: 'name',
 *   header: ({ column }) => <SortableHeader column={column}>Name</SortableHeader>,
 *   enableSorting: true,
 * }
 * ```
 */
export function SortableHeader({ column, children }: SortableHeaderProps) {
  const sortDirection = column.getIsSorted();

  return (
    <Group gap="xs" style={{ cursor: 'pointer' }}>
      <Text fw={700}>{children}</Text>
      {sortDirection === 'asc' ? (
        <IconSortAscending size={14} />
      ) : sortDirection === 'desc' ? (
        <IconSortDescending size={14} />
      ) : (
        <IconSelector size={14} />
      )}
    </Group>
  );
}

/**
 * Simple bold header (non-sortable)
 *
 * @example
 * ```tsx
 * {
 *   accessorKey: 'id',
 *   header: () => <BoldHeader>ID</BoldHeader>,
 *   enableSorting: false,
 * }
 * ```
 */
export function BoldHeader({ children }: { children: React.ReactNode }) {
  return <Text fw={700}>{children}</Text>;
}
