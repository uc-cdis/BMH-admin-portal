import { Center, Loader, Stack, Text } from '@mantine/core';

interface LoadingScreenProps {
  primaryMessage?: string;
  secondaryMessage?: string;
}

export function LoadingScreen({ primaryMessage = 'Loading...', secondaryMessage = '' }: LoadingScreenProps) {
  return (
    <Center style={{ minHeight: '100vh' }}>
      <Stack align="center" gap="md">
        <Loader size="lg" />
        <Text size="lg">{primaryMessage}</Text>
        {(secondaryMessage) ? <Text size="md" c="dimmed">{secondaryMessage}</Text> : null}
      </Stack>
    </Center>
  );
}
