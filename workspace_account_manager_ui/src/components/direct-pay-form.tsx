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
  Text,
  Anchor,
  Group,
} from '@mantine/core';
import { IconAlertCircle, IconCheck } from '@tabler/icons-react';

interface DirectPayFormProps {
  updateRedirectHome: (redirect: boolean) => void;
}

export default function DirectPayForm({ updateRedirectHome }: DirectPayFormProps) {
  const [formData, setFormData] = useState({
    billingId: '',
    accountName: '',
    contactName: '',
    contactEmail: '',
    institution: '',
    spendingLimit: '',
    projectDescription: '',
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

        {/* Billing Information */}
        <Stack gap="md">
          <Title order={5}>Billing Information</Title>

          <TextInput
            label="OCC Billing ID"
            placeholder="Enter your unique Billing ID from OCC"
            value={formData.billingId}
            onChange={handleChange('billingId')}
            required
            withAsterisk
            description={
              <Text size="xs" c="dimmed">
                If you don&apos;t have a Billing ID, visit the{' '}
                <Anchor
                  href="https://payments.occ-data.org/"
                  target="_blank"
                  rel="noopener noreferrer"
                  size="xs"
                >
                  Payment Solutions Portal
                </Anchor>
              </Text>
            }
          />

          <TextInput
            label="Account Name"
            placeholder="Name for this workspace account"
            value={formData.accountName}
            onChange={handleChange('accountName')}
            required
            withAsterisk
          />

          <NumberInput
            label="Requested Spending Limit (USD)"
            placeholder="e.g., 10000"
            value={formData.spendingLimit}
            onChange={(value) => setFormData((prev) => ({ ...prev, spendingLimit: String(value) }))}
            required
            withAsterisk
            min={0}
            step={100}
            thousandSeparator=","
            prefix="$"
          />
        </Stack>

        {/* Contact Information */}
        <Stack gap="md">
          <Title order={5}>Contact Information</Title>

          <TextInput
            label="Contact Name"
            value={formData.contactName}
            onChange={handleChange('contactName')}
            required
            withAsterisk
          />

          <TextInput
            label="Contact Email"
            type="email"
            value={formData.contactEmail}
            onChange={handleChange('contactEmail')}
            required
            withAsterisk
          />

          <TextInput
            label="Institution/Organization"
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
            placeholder="Describe how you plan to use this workspace..."
            value={formData.projectDescription}
            onChange={handleChange('projectDescription')}
            required
            withAsterisk
            rows={4}
          />
        </Stack>

        {/* Submit Button */}
        <Group justify="flex-end" mt="md">
          <Button type="submit" loading={isSubmitting} size="md" color="green">
            Submit Request
          </Button>
        </Group>
      </Stack>
    </form>
  );
}
