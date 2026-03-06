// Reusable sortable table header component for React Table

import { Group, Text } from '@mantine/core';
import { IconSortAscending, IconSortDescending, IconSelector } from '@tabler/icons-react';
import type { Column } from '@tanstack/react-table';

interface SortableHeaderProps {
  column: Column<any, unknown>;
  children: React.ReactNode;
}

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

export function BoldHeader({ children }: { children: React.ReactNode }) {
  return <Text fw={700}>{children}</Text>;
}
