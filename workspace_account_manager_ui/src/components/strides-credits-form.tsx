'use client';

import { useState, FormEvent } from 'react';
import {
  TextInput,
  Textarea,
  NumberInput,
  Button,
  Stack,
  Title,
  Alert,
  Group,
} from '@mantine/core';
import { IconAlertCircle, IconCheck } from '@tabler/icons-react';

interface StridesCreditFormProps {
  updateRedirectHome: (redirect: boolean) => void;
}

export default function StridesCreditForm({ updateRedirectHome }: StridesCreditFormProps) {
  const [formData, setFormData] = useState({
    requestorName: '',
    requestorEmail: '',
    institution: '',
    projectDescription: '',
    requestedCredits: '',
    justification: '',
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
      setSuccess(true);
      setTimeout(() => {
        updateRedirectHome(true);
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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

        {/* Requestor Information */}
        <Stack gap="md">
          <Title order={5}>Requestor Information</Title>

          <TextInput
            label="Name"
            value={formData.requestorName}
            onChange={handleChange('requestorName')}
            required
            withAsterisk
          />

          <TextInput
            label="Email"
            type="email"
            value={formData.requestorEmail}
            onChange={handleChange('requestorEmail')}
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

        {/* Project Information */}
        <Stack gap="md">
          <Title order={5}>Project Information</Title>

          <Textarea
            label="Project Description"
            placeholder="Describe your research project..."
            value={formData.projectDescription}
            onChange={handleChange('projectDescription')}
            required
            withAsterisk
            rows={4}
          />

          <NumberInput
            label="Requested Credits (USD)"
            placeholder="e.g., 5000"
            value={formData.requestedCredits}
            onChange={(value) => setFormData((prev) => ({ ...prev, requestedCredits: String(value) }))}
            required
            withAsterisk
            min={0}
            step={100}
            thousandSeparator=","
            prefix="$"
          />

          <Textarea
            label="Justification"
            placeholder="Explain why you need these credits..."
            value={formData.justification}
            onChange={handleChange('justification')}
            required
            withAsterisk
            rows={4}
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
