'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Container, Title, Text, SegmentedControl, Paper, Stack, Center } from '@mantine/core';
import StridesGrantForm from '@/components/strides-grant-form';
import StridesCreditForm from '@/components/strides-credits-form';
import DirectPayForm from '@/components/direct-pay-form';
import { authorizeCredits } from '@/lib/auth/authorization';

type FormOption = 'strides-grant' | 'strides-credits' | 'direct-pay' | '';

interface FormOptions {
  none?: string;
  stridesGrant?: string;
  stridesCredits?: string;
  directPay?: string;
}

const FORM_OPTIONS: FormOptions = {
  none: '',
  stridesGrant: 'strides-grant',
  stridesCredits: 'strides-credits',
  directPay: 'direct-pay',
};

const DEFAULT_FORM = FORM_OPTIONS.stridesGrant!;

export default function RequestWorkspacePage() {
  const controlColorMap: Record<string, string> = {
    [FORM_OPTIONS.directPay!]: 'green'
  };

  const router = useRouter();
  const [formToggle, setFormToggle] = useState<string>(DEFAULT_FORM);
  const [redirectHome, setRedirectHome] = useState(false);
  const [creditsAuthorized, setCreditsAuthorized] = useState(true);

  // Calculate available forms once on mount
  const [availableForms] = useState<FormOptions>(() => {
    // Handle disabled forms from environment variable
    if (process.env.NEXT_PUBLIC_DISABLED_FORMS) {
      try {
        const disabledForms = JSON.parse(process.env.NEXT_PUBLIC_DISABLED_FORMS);
        if (disabledForms && Array.isArray(disabledForms)) {
          const updatedForms = { ...FORM_OPTIONS };
          disabledForms.forEach((formName: string) => {
            if (formName in updatedForms) {
              delete updatedForms[formName as keyof FormOptions];
            }
          });
          return updatedForms;
        }
      } catch (err) {
        console.error(`Unable to parse disabled forms config: ${err}`);
      }
    }
    return FORM_OPTIONS;
  });

  // useEffect(() => {
  //   // Check authorization for credits form
  //   async function fetchAuthorized() {
  //     const cAuthorized = await authorizeCredits();

  //     if (cAuthorized && availableForms.stridesCredits) {
  //       setFormToggle(availableForms.stridesCredits);
  //     }
  //     setCreditsAuthorized(cAuthorized);
  //   }

  //   fetchAuthorized();
  // }, [availableForms.stridesCredits]);

  useEffect(() => {
    if (redirectHome) {
      router.push('/');
    }
  }, [redirectHome, router]);

  const handleChange = (value: string) => {
    setFormToggle(value);
  };

  const displayNameAbbrev = process.env.NEXT_PUBLIC_DISPLAY_NAME_ABBREVIATION || '';
  const displayName = process.env.NEXT_PUBLIC_DISPLAY_NAME || 'Biomedical Research Hub';

  // Build segmented control data
  const segmentedControlData = [];

  if (availableForms.stridesGrant) {
    segmentedControlData.push({
      value: availableForms.stridesGrant,
      label: 'STRIDES Grant/Award Funded',
    });
  }

  if (creditsAuthorized && availableForms.stridesCredits) {
    segmentedControlData.push({
      value: availableForms.stridesCredits,
      label: 'STRIDES Credits',
    });
  }

  if (availableForms.directPay) {
    segmentedControlData.push({
      value: availableForms.directPay,
      label: 'OCC Direct Pay',
    });
  }

  let componentToRender;

  if (formToggle === availableForms.stridesGrant) {
    componentToRender = (
      <Stack gap="md">
        <Text c="dimmed">
          {`If you have received NIH funding (e.g. a grant, contract, cooperative agreement, or other transaction agreement) and intend to use these funds for your ${displayNameAbbrev}account, please complete the form below. Please note that by choosing this option, your organization will be responsible for payment and therefore will need to provide Four Points Technology with a Purchase Order.`}
        </Text>
        <Title order={4}>Request Form for STRIDES Grant/Award Funded Account</Title>
        <StridesGrantForm updateRedirectHome={setRedirectHome} />
      </Stack>
    );
  } else if (formToggle === availableForms.stridesCredits) {
    componentToRender = (
      <Stack gap="md">
        <Text c="dimmed">
          {`If you are requesting credits from the NIH STRIDES Initiative for your ${displayNameAbbrev}account, please complete the form below. If your request is approved, then a new account with a spending limit will be provisioned for usage.`}
        </Text>
        <Title order={4}>Request Form for STRIDES Credits Account</Title>
        <StridesCreditForm updateRedirectHome={setRedirectHome} />
      </Stack>
    );
  } else if (formToggle === availableForms.directPay) {
    componentToRender = (
      <Stack gap="md">
        <Text c="dimmed">
          If you have registered through Payment Solutions Portal, received a unique Billing ID
          from OCC, and are requesting a workspace account through Direct Pay, please proceed
          with filling out the form below. If your request is approved, then a new account with a
          spending limit will be provisioned for usage. If you have not received a Billing ID from
          OCC, please proceed to the{' '}
          <Text
            component="a"
            href="https://payments.occ-data.org/"
            c="blue"
            td="underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            Payment Solutions Portal
          </Text>{' '}
          to complete your registration, and return to make a request here once you receive your
          Billing ID.
        </Text>
        <Title order={4}>Request Form for OCC Direct Pay Account</Title>
        <DirectPayForm updateRedirectHome={setRedirectHome} />
      </Stack>
    );
  }

  return (
    <Container size="xl" py="xl">
      <Stack gap="xl">
        <Paper shadow="sm" p="xl" radius="md" withBorder>
          {/* Header */}
          <Stack gap="md" mb="xl">
            <Center>
              <Stack gap="xs" align="center">
                <Title order={2}>Workspace Account Request Form</Title>
                <Text size="lg" c="dimmed">
                  The form below is used to request a newly provisioned Gen3 Workspace Account.
                </Text>
              </Stack>
            </Center>
          </Stack>

          {/* Form Type Toggle */}
          {segmentedControlData.length > 0 && (
            <Center mb="xl">
              <SegmentedControl
                value={formToggle}
                onChange={handleChange}
                data={segmentedControlData}
                size="md"
                radius="md"
                color={controlColorMap[formToggle] || 'blue'}
              />
            </Center>
          )}

          {/* Form Content */}
          {componentToRender}
        </Paper>

        {/* Footer */}
        <Center>
          <Text size="sm" c="dimmed">
            &copy; 2026 {displayName}
          </Text>
        </Center>
      </Stack>
    </Container>
  );
}
