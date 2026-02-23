'use client';

import { useState } from 'react';
import {
  TextInput,
  Button,
  Stack,
  Alert,
  Group,
  Tooltip,
  Select,
  Checkbox,
} from '@mantine/core';
import { Form, matchesField, isNotEmpty, useForm } from '@mantine/form';
import { IconAlertCircle, IconCheck } from '@tabler/icons-react';
import { requestWorkspace, StridesCreditsWorkspaceFormData } from '@/lib/api/workspace-api';

interface StridesCreditsFormProps {
  updateRedirectHome: (redirect: boolean) => void;
}

const NIH_GRANT_NUMBER_REGEX = /^([0-9]{1})([A-Z0-9]{3})([A-Z]{2}[0-9]{6})-([A-Z0-9]{2}$|[A-Z0-9]{4}$)/gm
const NIH_EMAIL_REGEX = /^((?!-)[A-Za-z0-9-._]{1,63}(?<!-))+(@)((?!-)[A-Za-z0-9-]{1,63}(?<!-)\.)*nih.gov$/gm

export default function StridesCreditsForm({ updateRedirectHome }: StridesCreditsFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const form = useForm({
    initialValues: {
      workspace_type: "STRIDES Credits",
      scientific_poc: "",
      poc_email: "accounts@" + process.env.NEXT_PUBLIC_ROOT_EMAIL_DOMAIN,
      confirm_poc_email: "accounts@" + process.env.NEXT_PUBLIC_ROOT_EMAIL_DOMAIN,
      internal_poc_email: '',
      confirm_internal_poc_email: '',
      scientific_institution_domain_name: "",
      nih_funded_award_number: "",
      administering_nih_institute: "",
      intramural: false,
      ecs: true,
      summary_and_justification: "",
      project_short_title: "",
      attestation: false
    },
    validateInputOnChange: ['internal_poc_email', 'confirm_internal_poc_email', 'administering_nih_institute', 'nih_funded_award_number'],
    // functions will be used to validate values at corresponding key
    validate: {
      internal_poc_email: (value, values) => {
        if (values.intramural) {
          if (value.trim() && !value.trim().match(NIH_EMAIL_REGEX)) {
            return 'Intramural user must their NIH email to request account';
          }
          return null;
        }
        if (value.trim() && !/^\S+@\S+$/.test(value)) {
          return 'Must be a valid email';
        }
        return null;
      },
      confirm_internal_poc_email: matchesField('internal_poc_email', 'Must match email'),
      administering_nih_institute: isNotEmpty('Must select NIH IoC'),
      nih_funded_award_number: (value) => (value.trim() && !value.trim().match(NIH_GRANT_NUMBER_REGEX)) ? "Must match NIH grant number format" : null,
    },
  });

  const handleSubmit = (values: StridesCreditsWorkspaceFormData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      requestWorkspace(values);
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
    <Form onSubmit={handleSubmit} form={form}>
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

        <Stack gap="md">
          <Group grow>
            <TextInput
              label="Scientific POC Name"
              placeholder="John Smith"
              key={form.key('scientific_poc')}
              {...form.getInputProps('scientific_poc')}
              required
              withAsterisk
              inputContainer={(children) => (
                <Tooltip.Floating multiline
                  w={300}
                  label="Principal Investigator or other awardee who has overall responsibility for scientific direction,
            responsible for setting (or delegating) security policies and financial oversight of cloud resources"
                  position="top-start">
                  {children}
                </Tooltip.Floating>
              )}
            />
            <TextInput
              label="Scientific Institution Domain Name"
              placeholder="Domain Name of University or Institution"
              key={form.key('scientific_institution_domain_name')}
              {...form.getInputProps('scientific_institution_domain_name')}
              required
              withAsterisk
              inputContainer={(children) => (
                <Tooltip.Floating multiline
                  w={300}
                  label="Examples: hms.harvard.edu, nih.gov, uchicago.edu, etc."
                  position="top-start">
                  {children}
                </Tooltip.Floating>
              )}
            />
          </Group>
          <Group grow>
            <TextInput
              label="Scientific POC Email"
              placeholder="user@email.org"
              key={form.key('internal_poc_email')}
              {...form.getInputProps('internal_poc_email')}
              required
              withAsterisk
              inputContainer={(children) => (
                <Tooltip.Floating multiline
                  w={300}
                  label="Email address used for contact regarding the workspace"
                  position="top-start">
                  {children}
                </Tooltip.Floating>
              )}
            />
            <TextInput
              label="Confirm Scientific POC Email"
              placeholder="user@email.org"
              key={form.key('confirm_internal_poc_email')}
              {...form.getInputProps('confirm_internal_poc_email')}
              required
              withAsterisk
            />
          </Group>
          <Group grow>
            <TextInput
              label="NIH Funded Project Award/Credits Number "
              placeholder="1A23BC012345-01 or 1A23BC012345-01D6"
              key={form.key('nih_funded_award_number')}
              {...form.getInputProps('nih_funded_award_number')}
              required
              withAsterisk
              disabled={form.values.intramural}
              inputContainer={(children) => (
                <Tooltip.Floating multiline
                  w={300}
                  label="Derived from NIH Notice of Award, uniquely identifies NIH-funded research projects"
                  position="top-start">
                  {children}
                </Tooltip.Floating>
              )}
            />
            <Select
              label="Administering NIH Institute or Center"
              data={[
                { value: '', label: '' },
                { value: 'CC - NIH Clinical Center', label: 'CC - NIH Clinical Center' },
                { value: 'CIT - Center for Information Technology', label: 'CIT - Center for Information Technology' },
                { value: 'CSR - Center for Scientific Review', label: 'CSR - Center for Scientific Review' },
                { value: 'FIC - Fogarty International Center', label: 'FIC - Fogarty International Center' },
                { value: 'NCATS - National Center for Advancing Translational Sciences', label: 'NCATS - National Center for Advancing Translational Sciences' },
                { value: 'NCCIH - National Center for Complementary and Integrative Health', label: 'NCCIH - National Center for Complementary and Integrative Health' },
                { value: 'NCI - National Cancer Institute', label: 'NCI - National Cancer Institute' },
                { value: 'NEI - National Eye Institute', label: 'NEI - National Eye Institute' },
                { value: 'NHGRI - National Human Genome Research Institute', label: 'NHGRI - National Human Genome Research Institute' },
                { value: 'NHLBI - National Heart, Lung, and Blood Institute', label: 'NHLBI - National Heart, Lung, and Blood Institute' },
                { value: 'NIA - National Institute on Aging', label: 'NIA - National Institute on Aging' },
                { value: 'NIAAA - National Institute on Alcohol Abuse and Alcoholism', label: 'NIAAA - National Institute on Alcohol Abuse and Alcoholism' },
                { value: 'NIAID - National Institute of Allergy and Infectious Diseases', label: 'NIAID - National Institute of Allergy and Infectious Diseases' },
                { value: 'NIAMS - National Institute of Arthritis and Musculoskeletal and Skin Diseases', label: 'NIAMS - National Institute of Arthritis and Musculoskeletal and Skin Diseases' },
                { value: 'NIBIB - National Institute of Biomedical Imaging and Bioengineering', label: 'NIBIB - National Institute of Biomedical Imaging and Bioengineering' },
                { value: 'NICHD - National Institute of Child Health and Human Development', label: 'NICHD - National Institute of Child Health and Human Development' },
                { value: 'NIDA - National Institute on Drug Abuse', label: 'NIDA - National Institute on Drug Abuse' },
                { value: 'NIDCD - National Institute on Deafness and Other Communication Disorders', label: 'NIDCD - National Institute on Deafness and Other Communication Disorders' },
                { value: 'NIDCR - National Institute of Dental and Craniofacial Research', label: 'NIDCR - National Institute of Dental and Craniofacial Research' },
                { value: 'NIDDK - National Institute of Diabetes and Digestive and Kidney Diseases', label: 'NIDDK - National Institute of Diabetes and Digestive and Kidney Diseases' },
                { value: 'NIEHS - National Institute of Environmental Health Sciences', label: 'NIEHS - National Institute of Environmental Health Sciences' },
                { value: 'NIGMS - National Institute of General Medical Sciences', label: 'NIGMS - National Institute of General Medical Sciences' },
                { value: 'NIMH - National Institute of Mental Health', label: 'NIMH - National Institute of Mental Health' },
                { value: 'NIMHD - National Institute on Minority Health and Health Disparities', label: 'NIMHD - National Institute on Minority Health and Health Disparities' },
                { value: 'NINDS - National Institute of Neurological Disorders and Stroke', label: 'NINDS - National Institute of Neurological Disorders and Stroke' },
                { value: 'NINR - National Institute of Nursing Research', label: 'NINR - National Institute of Nursing Research' },
                { value: 'NLM - National Library of Medicine', label: 'NLM - National Library of Medicine' },
                { value: 'OD - NIH Office of the Director', label: 'OD - NIH Office of the Director' },
              ]}
              required
              withAsterisk
              {...form.getInputProps('administering_nih_institute')}
            />
          </Group>
          <Checkbox
            label="I have an intramural account; it is not funded through a project award/grant number"
            onChange={(event) => {
              const isChecked = event.currentTarget.checked;
              form.setFieldValue('intramural', isChecked);

              // Clear the text field when checkbox is unchecked
              if (isChecked) {
                form.setFieldValue('nih_funded_award_number', '');
              }
            }}
          />
          <TextInput
            label="Project Summary and Justification"
            key={form.key('summary_and_justification')}
            {...form.getInputProps('summary_and_justification')}
            required
            withAsterisk
            inputContainer={(children) => (
              <Tooltip.Floating multiline
                w={300}
                label="Brief description of the research problem clearly identifying the direct relevance of the project to biomedical research"
                position="top-start">
                {children}
              </Tooltip.Floating>
            )}
          />
          <TextInput
            label="Project Short Title"
            placeholder="Project Title"
            key={form.key('project_short_title')}
            {...form.getInputProps('project_short_title')}
            maxLength={16}
            inputContainer={(children) => (
              <Tooltip.Floating multiline
                w={300}
                label="A short title of the project (maximum 16 characters)"
                position="top-start">
                {children}
              </Tooltip.Floating>
            )}
          />
          <Checkbox
            label="I acknowledge to submit this form"
            required
            {...form.getInputProps('attestation', { type: 'checkbox' })}
          />
        </Stack>

        {/* Submit Button */}
        <Group justify="center" mt="md">
          <Button type="submit" loading={isSubmitting} disabled={isSubmitting} size="lg">
            Submit Request
          </Button>
        </Group>
      </Stack>
    </Form>
  );
}
