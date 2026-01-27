import {
  Button,
  Heading,
  Section,
  Text,
} from '@react-email/components'
import { BaseEmail } from './base-email'
import * as React from 'react'

interface VerificationApprovedEmailProps {
  user_name?: string
  dashboard_url?: string
  platform_url?: string
}

export function VerificationApprovedEmail({
  user_name = 'Teacher',
  dashboard_url,
  platform_url = 'https://akomaylessonplanna.com',
}: VerificationApprovedEmailProps) {
  return (
    <BaseEmail
      preview={`Your teacher verification has been approved! 🎉`}
      platformUrl={platform_url}
    >
      <Heading style={heading}>Verification Approved! 🎉</Heading>

      <Text style={paragraph}>
        Hi {user_name},
      </Text>

      <Text style={paragraph}>
        Great news! Your teacher verification has been approved. You can now start selling on Ako may lesson plan na!!
      </Text>

      <Section style={infoBox}>
        <Text style={infoText}>
          <strong>What's next?</strong>
        </Text>
        <Text style={listItem}>• Upload your first product</Text>
        <Text style={listItem}>• Set up your seller profile</Text>
        <Text style={listItem}>• Start earning from your lesson plans</Text>
      </Section>

      {dashboard_url && (
        <Section style={buttonSection}>
          <Button href={dashboard_url} style={button}>
            Go to Dashboard
          </Button>
        </Section>
      )}

      <Text style={paragraph}>
        Welcome to the Ako may lesson plan na! seller community! We're excited to have you on board.
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

const infoBox = {
  backgroundColor: '#f0fdf4',
  borderLeft: '4px solid #22c55e',
  padding: '16px',
  marginBottom: '24px',
}

const infoText = {
  fontSize: '14px',
  lineHeight: '20px',
  color: '#1a202c',
  margin: '4px 0',
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
