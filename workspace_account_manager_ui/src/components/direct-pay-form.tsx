'use client';

import { useState } from 'react';
import {
  TextInput,
  Textarea,
  Button,
  Stack,
  Title,
  Alert,
  Text,
  Anchor,
  Group,
  Select,
  Checkbox,
  Tooltip,
  ActionIcon,
} from '@mantine/core';
import { IconAlertCircle, IconCheck, IconHelp } from '@tabler/icons-react';
import { requestWorkspace, callExternalURL, type DirectPayWorkspaceFormData } from '@/lib/api/workspace-api';
import { Form, isNotEmpty, useForm } from '@mantine/form';

interface DirectPayFormProps {
  updateRedirectHome: (redirect: boolean) => void;
}

const occHelpURL = process.env.NEXT_PUBLIC_OCC_HELPER_URL;

export default function DirectPayForm({ updateRedirectHome }: DirectPayFormProps) {
  // Billing ID confirmation state
  const [billingIdConfirmed, setBillingIdConfirmed] = useState<boolean | null>(null);
  const [directPayLimit, setDirectPayLimit] = useState(0);
  const [isConfirmingBilling, setIsConfirming] = useState(false);
  const [billingFormDisabled, setBillingFormDisabled] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Billing ID confirmation form
  const directPayBillingForm = useForm({
    initialValues: {
      billing_id: '',
      leading_partial_email: '',
    },
    validate: {
      billing_id: isNotEmpty('Billing ID is required'),
      leading_partial_email: isNotEmpty('First 3 characters of email is required'),
    },
  });

  // Main workspace request form
  const directPayWorkspaceForm = useForm({
    initialValues: {
      workspace_type: 'Direct Pay',
      project_title: '',
      summary_and_justification: '',
      workspace_use: '',
      ecs: true,
      approved_credit_card: false,
      project_role: '',
    },
    validate: {
      project_title: isNotEmpty('Project title is required'),
      summary_and_justification: isNotEmpty('Summary and justification are required'),
      workspace_use: isNotEmpty('Please select workspace use'),
      approved_credit_card: isNotEmpty('ou must approve the credit card consent'),
      project_role: isNotEmpty('Please select your project role'),
    },
  });

  // Handle billing ID confirmation
  const handleBillingFormSubmit = async (values: typeof directPayBillingForm.values) => {
    setIsConfirming(true);
    setError(null);
    setBillingIdConfirmed(null);

    try {
      const data = {
        queryStringParameters: {
          method: 'confirmBillingID',
          pp_data: {
            AGBillingID: values.billing_id,
            Email: values.leading_partial_email,
          },
        },
      };

      const headers = {
        'Content-Type': 'text/plain',
      };

      const response = await callExternalURL<any>(
        occHelpURL!,
        'POST',
        headers,
        data
      );

      if (
        response?.statusCode !== 400 &&
        response?.body?.[0]?.Message?.statusCode === 200
      ) {
        setBillingIdConfirmed(true);
        setDirectPayLimit(response.body[0].Message.body);
        setBillingFormDisabled(true);
        console.log('Billing ID confirmed, limit:', response.body[0].Message.body);
      } else {
        console.error('Billing ID confirmation failed');
        setBillingIdConfirmed(false);
        setError('Cannot confirm BillingID. Please check your BillingID and email and try again.');
      }
    } catch (err) {
      console.error('Billing ID confirmation error:', err);
      setBillingIdConfirmed(false);
      setError('Failed to confirm BillingID. Please try again or contact OCC.');
    } finally {
      setIsConfirming(false);
    }
  };

  // Handle workspace request submission
  const handleWorkspaceFormSubmit = async (values: typeof directPayWorkspaceForm.values) => {
    setIsSubmitting(true);
    setError(null);

    try {
      // Build workspace request payload
      const payload: DirectPayWorkspaceFormData = {
        workspace_type: values.workspace_type,
        ecs: values.ecs,
        summary_and_justification: values.summary_and_justification,
        project_short_title: values.project_title
      };

      const response = await requestWorkspace(payload);
      const requestId = response?.workspace_request_id;

      if (requestId) {
        // Make additional API call to OCC
        await requestAPICall(requestId, directPayBillingForm.values, values);
      }

      console.log('Workspace request submitted:', response);
      setSuccess(true);

      // Redirect after success
      setTimeout(() => {
        updateRedirectHome(true);
      }, 2000);
    } catch (err) {
      console.error('Workspace request error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred submitting your request');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Additional OCC API call after workspace request
  const requestAPICall = async (
    requestId: string,
    billingFormValues: typeof directPayBillingForm.values,
    workspaceFormValues: typeof directPayWorkspaceForm.values
  ) => {
    try {
      const data = {
        queryStringParameters: {
          method: 'handleRequest',
          pp_data: {
            AGBillingID: billingFormValues.billing_id,
            Email: billingFormValues.leading_partial_email,
            ProjectTitle: workspaceFormValues.project_title,
            ProjectSummary: workspaceFormValues.summary_and_justification,
            WorkspaceUse: workspaceFormValues.workspace_use,
            ApprovedCreditCard: workspaceFormValues.approved_credit_card ? 'Yes' : 'No',
            ProjectRole: workspaceFormValues.project_role,
            RequestUUID: requestId,
          },
        },
      };

      const headers = {
        'Content-Type': 'text/plain',
      };

      const response = await callExternalURL(occHelpURL!, 'POST', headers, data);
      console.log('OCC API call response:', response);
    } catch (err) {
      console.error('OCC API call error:', err);
      // Don't throw error here, workspace request was already successful
    }
  };

  if (success) {
    return (
      <Alert
        icon={<IconCheck size="1rem" />}
        title="Request Submitted Successfully!"
        color="green"
        variant="light"
      >
        Your Direct Pay workspace request has been submitted and is pending approval.
      </Alert>
    );
  }

  return (
    <Stack gap="lg">
      {/* Billing ID Confirmation Form */}
      <Form onSubmit={handleBillingFormSubmit} form={directPayBillingForm}>
        <Stack gap="md">
          <Title order={5}>Billing ID Confirmation</Title>

          <TextInput
            label={
              <Group gap="xs">
                <Text>Billing ID</Text>
                <Tooltip
                  label={
                    <>
                      Enter the Billing ID provided from registration through the Payment
                      Solutions Portal.
                      <br />
                      If you have not received a BillingID, please complete registration at:{' '}
                      <Anchor
                        href="https://payments.occ-data.org/"
                        target="_blank"
                        c="blue"
                      >
                        https://payments.occ-data.org/
                      </Anchor>
                    </>
                  }
                  multiline
                  w={300}
                >
                  <ActionIcon variant="transparent" size="sm">
                    <IconHelp size="1rem" />
                  </ActionIcon>
                </Tooltip>
              </Group>
            }
            placeholder="Enter BillingID"
            required
            withAsterisk
            disabled={billingFormDisabled}
            {...directPayBillingForm.getInputProps('billing_id')}
          />

          <TextInput
            label={
              <Group gap="xs">
                <Text>First 3 Characters of Associated Email Address</Text>
                <Tooltip
                  label="Enter the first three characters of the email associated with your OCC BillingID. Ex: Email address JohnDoe@gmail.com should enter 'Joh' in the box"
                  multiline
                  w={300}
                >
                  <ActionIcon variant="transparent" size="sm">
                    <IconHelp size="1rem" />
                  </ActionIcon>
                </Tooltip>
              </Group>
            }
            placeholder="Enter First Three Characters of Email"
            required
            withAsterisk
            disabled={billingFormDisabled}
            maxLength={3}
            {...directPayBillingForm.getInputProps('leading_partial_email')}
          />

          <Button
            type="submit"
            loading={isConfirmingBilling}
            disabled={billingFormDisabled || isConfirmingBilling}
            color="blue"
          >
            Confirm BillingID
          </Button>
        </Stack>
      </Form>

      {/* Error Alert */}
      {billingIdConfirmed === false && (
        <Alert
          icon={<IconAlertCircle size="1rem" />}
          title="Billing ID Confirmation Failed"
          color="red"
          variant="light"
        >
          Cannot confirm BillingID. Please correct the BillingID number you entered and/or
          the email characters and try again, or contact OCC at{' '}
          <Anchor href="mailto:pp@occ-data.org">pp@occ-data.org</Anchor>
        </Alert>
      )}

      {/* Main Form (shown after billing ID confirmation) */}
      {billingIdConfirmed === true && (
        <Form onSubmit={handleWorkspaceFormSubmit} form={directPayWorkspaceForm}>
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

            {/* Credit Card Consent */}
            <Checkbox
              label={
                <Text size="sm">
                  By filling out this form below, I consent to be invoiced by OCC the amount
                  of <strong>${directPayLimit}</strong> to provision that amount of compute
                  for my workspace. I confirm that I have a credit card that I am allowed to
                  use for this purchase.
                </Text>
              }
              required
              {...directPayWorkspaceForm.getInputProps('approved_credit_card', { type: 'checkbox' })}
            />

            <Text size="sm" c="dimmed">
              If this value is incorrect, please contact OCC (
              <Anchor href="mailto:billing@occ-data.org">billing@occ-data.org</Anchor>) to
              update your request amount.
            </Text>

            {/* Project Information */}
            <Stack gap="md">
              <Title order={5}>Project Information</Title>

              <TextInput
                label={
                  <Group gap="xs">
                    <Text>Project Brief Title</Text>
                    <Tooltip label="Please enter a brief title for your project">
                      <ActionIcon variant="transparent" size="sm">
                        <IconHelp size="1rem" />
                      </ActionIcon>
                    </Tooltip>
                  </Group>
                }
                placeholder="Enter Project Brief Title"
                required
                withAsterisk
                {...directPayWorkspaceForm.getInputProps('project_title')}
              />

              <Textarea
                label={
                  <Group gap="xs">
                    <Text>Brief Project Summary and Justification</Text>
                    <Tooltip label="Please enter a brief summary and justification for your project">
                      <ActionIcon variant="transparent" size="sm">
                        <IconHelp size="1rem" />
                      </ActionIcon>
                    </Tooltip>
                  </Group>
                }
                placeholder="Enter Brief Summary and Justification"
                required
                withAsterisk
                rows={4}
                {...directPayWorkspaceForm.getInputProps('summary_and_justification')}
              />

              <Select
                label={
                  <Group gap="xs">
                    <Text>Workspace Use</Text>
                    <Tooltip label="Please select whether the workspace is intended for personal or organizational use">
                      <ActionIcon variant="transparent" size="sm">
                        <IconHelp size="1rem" />
                      </ActionIcon>
                    </Tooltip>
                  </Group>
                }
                placeholder="Select workspace use"
                data={['Personal', 'Organizational']}
                required
                withAsterisk
                {...directPayWorkspaceForm.getInputProps('workspace_use')}
              />

              <Select
                label={
                  <Group gap="xs">
                    <Text>Role on Project</Text>
                    <Tooltip label="Please select the option that best describes your role on the project">
                      <ActionIcon variant="transparent" size="sm">
                        <IconHelp size="1rem" />
                      </ActionIcon>
                    </Tooltip>
                  </Group>
                }
                placeholder="Select your role"
                data={[
                  'Principal Investigator',
                  'Co-Principal Investigator',
                  'Co-Investigator',
                  'Administrator',
                  'Clinical Collaborator',
                  'Clinical Coordinator',
                  'Data Analyst',
                  'Data Manager',
                  'Research Coordinator',
                  'Other',
                ]}
                required
                withAsterisk
                {...directPayWorkspaceForm.getInputProps('project_role')}
              />
            </Stack>

            {/* Submit Button */}
            <Group justify="center" mt="md">
              <Button type="submit" loading={isSubmitting} disabled={isSubmitting} size="lg" color="blue">
                Submit Request
              </Button>
            </Group>
          </Stack>
        </Form>
      )}
    </Stack>
  );
}
