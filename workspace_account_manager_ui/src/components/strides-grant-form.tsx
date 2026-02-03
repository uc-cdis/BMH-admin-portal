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
import { Form, useForm } from '@mantine/form';
import { IconAlertCircle, IconCheck } from '@tabler/icons-react';

interface StridesGrantFormProps {
  updateRedirectHome: (redirect: boolean) => void;
}

export default function StridesGrantForm({ updateRedirectHome }: StridesGrantFormProps) {
  // const [formData, setFormData] = useState({
  //   grantNumber: '',
  //   piName: '',
  //   piEmail: '',
  //   institution: '',
  //   projectTitle: '',
  // });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const form = useForm({
    initialValues: {
      workspace_type: "STRIDES Grant",
      scientific_poc: "",
      poc_email: "accounts@" + process.env.NEXT_PUBLIC_ROOT_EMAIL_DOMAIN,
      confirm_poc_email: "accounts@" + process.env.NEXT_PUBLIC_ROOT_EMAIL_DOMAIN,
      scientific_institution_domain_name: "",
      nih_funded_award_number: "",
      administering_nih_institute: "",
      program_officer_approval: "No",
      nih_program_official_name: "",
      nih_program_official_email: "",
      keywords: "",
      ecs: true,
      summary_and_justification: "",
      project_short_title: "",
      rcdc: "",
      additional_poc_email: "",
      additional_poc_job_title: "",
      attestation: false
    },

    // functions will be used to validate values at corresponding key
    validate: {
    },
  });

  const handleSubmit = (values: typeof form.values) => {
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

  // const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
  //   setFormData((prev) => ({ ...prev, [field]: e.target.value }));
  // };

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
              key={form.key('poc_email')}
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
              key={form.key('confirm_poc_email')}
              required
              withAsterisk
            />
          </Group>
          <Group grow>
            <TextInput
              label="NIH Funded Project Award/Grant Number "
              placeholder="1A23BC012345-01 or 1A23BC012345-01D6"
              key={form.key('nih_funded_award_number')}
              required
              withAsterisk
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
          <Select
            label="Do you have Program Officer Approval?"
            data={[
              { value: 'No', label: 'No' },
              { value: 'Yes', label: 'Yes' },
            ]}
            required
            {...form.getInputProps('program_officer_approval')}
          />
          <Group grow>
            <TextInput
              label="NIH Program Official Name"
              placeholder="Jane Doe"
              key={form.key('nih_program_official_name')}
              inputContainer={(children) => (
                <Tooltip.Floating multiline
                  w={300}
                  label="Derived from Notice of Award"
                  position="top-start">
                  {children}
                </Tooltip.Floating>
              )}
            />
            <TextInput
              label="NIH Program Official Email"
              placeholder="jdoe@nih.gov"
              key={form.key('nih_program_official_email')}
              inputContainer={(children) => (
                <Tooltip.Floating multiline
                  w={300}
                  label="Derived from Notice of Award"
                  position="top-start">
                  {children}
                </Tooltip.Floating>
              )}
            />
          </Group>
          <TextInput
            label="Keywords"
            key={form.key('keywords')}
            required
            withAsterisk
            inputContainer={(children) => (
              <Tooltip.Floating multiline
                w={300}
                label="List of terms describing scientific area(s), technologies, and/or conditions relevant to research project"
                position="top-start">
                {children}
              </Tooltip.Floating>
            )}
          />
          <TextInput
            label="Project Summary and Justification"
            key={form.key('summary_and_justification')}
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
          <Group grow>
            <TextInput
              label="Project Short Title"
              placeholder="Project Title"
              key={form.key('project_short_title')}
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
            <TextInput
              label="Research, Condition, and Disease Categorization"
              key={form.key('rcdc')}
              inputContainer={(children) => (
                <Tooltip.Floating multiline
                  w={300}
                  label="See https://report.nih.gov/categorical_spending.aspx for detailed list"
                  position="top-start">
                  {children}
                </Tooltip.Floating>
              )}
            />
          </Group>
          <Group grow>
            <TextInput
              label="Technical or Additional POC Email"
              placeholder="additional_poc@email.com"
              key={form.key('additional_poc_email')}
            />
            <TextInput
              label="Job Title of Additional POC"
              placeholder="Job Title"
              key={form.key('additional_poc_job_title')}
              inputContainer={(children) => (
                <Tooltip.Floating multiline
                  w={300}
                  label="Job title or affiliation with the research program"
                  position="top-start">
                  {children}
                </Tooltip.Floating>
              )}
            />
          </Group>
          <Checkbox
            label="I acknowledge to submit this form"
            required
            {...form.getInputProps('attestation', { type: 'checkbox' })}
          />
        </Stack>

        {/* Submit Button */}
        <Group justify="center" mt="md">
          <Button type="submit" loading={isSubmitting} size="lg">
            Submit Request
          </Button>
        </Group>
      </Stack>
    </Form>
  );
}
