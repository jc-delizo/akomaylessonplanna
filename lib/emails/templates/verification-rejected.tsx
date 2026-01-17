import {
  Button,
  Heading,
  Section,
  Text,
} from '@react-email/components'
import { BaseEmail } from './base-email'
import * as React from 'react'

interface VerificationRejectedEmailProps {
  user_name?: string
  rejection_reason?: string
  resubmit_link?: string
  platform_url?: string
}

export function VerificationRejectedEmail({
  user_name = 'Teacher',
  rejection_reason,
  resubmit_link,
  platform_url = 'https://akomaylessonplanna.com',
}: VerificationRejectedEmailProps) {
  return (
    <BaseEmail
      preview={`Action needed: Your verification needs changes`}
      platformUrl={platform_url}
    >
      <Heading style={heading}>Verification Needs Changes</Heading>

      <Text style={paragraph}>
        Hi {user_name},
      </Text>

      <Text style={paragraph}>
        We've reviewed your teacher verification request, but we need some additional information or changes.
      </Text>

      {rejection_reason && (
        <Section style={reasonBox}>
          <Text style={sectionHeading}>Reason:</Text>
          <Text style={reasonText}>{rejection_reason}</Text>
        </Section>
      )}

      <Text style={paragraph}>
        <strong>What to do next:</strong>
      </Text>
      <Text style={listItem}>• Review the feedback above</Text>
      <Text style={listItem}>• Update your verification documents if needed</Text>
      <Text style={listItem}>• Resubmit your verification request</Text>

      {resubmit_link && (
        <Section style={buttonSection}>
          <Button href={resubmit_link} style={button}>
            Resubmit Verification
          </Button>
        </Section>
      )}

      <Text style={paragraph}>
        If you have any questions, please contact our support team. We're here to help!
      </Text>
    </BaseEmail>
  )
}

const heading = {
  fontSize: '24px',
  fontWeight: 'bold',
  color: '#1a202c',
  marginBottom: '16px',
}

const paragraph = {
  fontSize: '16px',
  lineHeight: '24px',
  color: '#1a202c',
  marginBottom: '16px',
}

const reasonBox = {
  backgroundColor: '#fef2f2',
  borderLeft: '4px solid #ef4444',
  padding: '16px',
  marginBottom: '24px',
}

const sectionHeading = {
  fontSize: '16px',
  fontWeight: 'bold',
  color: '#1a202c',
  marginBottom: '8px',
}

const reasonText = {
  fontSize: '14px',
  lineHeight: '20px',
  color: '#4a5568',
}

const listItem = {
  fontSize: '14px',
  lineHeight: '20px',
  color: '#4a5568',
  marginBottom: '8px',
  paddingLeft: '8px',
}

const buttonSection = {
  textAlign: 'center' as const,
  marginBottom: '24px',
}

const button = {
  backgroundColor: '#667eea',
  color: '#ffffff',
  padding: '12px 24px',
  borderRadius: '8px',
  textDecoration: 'none',
  display: 'inline-block',
  fontWeight: 'bold',
}
