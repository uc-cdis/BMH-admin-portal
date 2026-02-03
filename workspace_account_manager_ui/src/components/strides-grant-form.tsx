'use client';

import { useState, FormEvent } from 'react';
import {
  TextInput,
  Button,
  Stack,
  Title,
  Alert,
  Group,
} from '@mantine/core';
import { IconAlertCircle, IconCheck } from '@tabler/icons-react';

interface StridesGrantFormProps {
  updateRedirectHome: (redirect: boolean) => void;
}

export default function StridesGrantForm({ updateRedirectHome }: StridesGrantFormProps) {
  const [formData, setFormData] = useState({
    grantNumber: '',
    piName: '',
    piEmail: '',
    institution: '',
    projectTitle: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      // TODO: Implement actual form submission logic
      // const response = await fetch('/api/workspace/request-grant', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(formData),
      // });

      // if (!response.ok) throw new Error('Submission failed');

      setSuccess(true);
      // Redirect after success
      setTimeout(() => {
        updateRedirectHome(true);
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
  };

  if (success) {
    return (
      <Alert
        icon={<IconCheck size="1rem" />}
        title="Request Submitted Successfully!"
        color="green"
        variant="light"
      >
        Redirecting to homepage...
      </Alert>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <Stack gap="lg">
        {error && (
          <Alert
            icon={<IconAlertCircle size="1rem" />}
            title="Error"
            color="red"
            variant="light"
          >
            {error}
          </Alert>
        )}

        {/* Grant Information */}
        <Stack gap="md">
          <Title order={5}>Grant Information</Title>

          <TextInput
            label="Grant Number"
            placeholder="e.g., R01-CA123456"
            value={formData.grantNumber}
            onChange={handleChange('grantNumber')}
            required
            withAsterisk
          />

          <TextInput
            label="Project Title"
            value={formData.projectTitle}
            onChange={handleChange('projectTitle')}
            required
            withAsterisk
          />
        </Stack>

        {/* Principal Investigator */}
        <Stack gap="md">
          <Title order={5}>Principal Investigator</Title>

          <TextInput
            label="PI Name"
            value={formData.piName}
            onChange={handleChange('piName')}
            required
            withAsterisk
          />

          <TextInput
            label="PI Email"
            type="email"
            value={formData.piEmail}
            onChange={handleChange('piEmail')}
            required
            withAsterisk
          />

          <TextInput
            label="Institution"
            value={formData.institution}
            onChange={handleChange('institution')}
            required
            withAsterisk
          />
        </Stack>

        {/* Submit Button */}
        <Group justify="flex-end" mt="md">
          <Button type="submit" loading={isSubmitting} size="md">
            Submit Request
          </Button>
        </Group>
      </Stack>
    </form>
  );
}
