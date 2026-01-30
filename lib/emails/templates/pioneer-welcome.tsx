import {
  Button,
  Heading,
  Section,
  Text,
} from '@react-email/components'
import { BaseEmail } from './base-email'
import * as React from 'react'

interface PioneerWelcomeEmailProps {
  user_name?: string
  dashboard_url?: string
  platform_url?: string
}

export function PioneerWelcomeEmail({
  user_name = 'Seller',
  dashboard_url,
  platform_url = 'https://akomaylessonplanna.com',
}: PioneerWelcomeEmailProps) {
  return (
    <BaseEmail
      preview="Welcome to the Pioneer Program!"
      platformUrl={platform_url}
    >
      <Heading style={heading}>Welcome to the Pioneer Program!</Heading>

      <Text style={paragraph}>
        Hi {user_name},
      </Text>

      <Text style={paragraph}>
        You have been invited to join the Pioneer Seller program on Ako may lesson plan na! As a Pioneer, you get:
      </Text>

      <Section style={infoBox}>
        <Text style={infoText}>
          <strong>Pioneer benefits</strong>
        </Text>
        <Text style={listItem}>• 15% commission (instead of 20%)</Text>
        <Text style={listItem}>• Pro features at no extra cost</Text>
        <Text style={listItem}>• Pioneer badge on your profile</Text>
      </Section>

      {dashboard_url && (
        <Section style={buttonSection}>
          <Button href={dashboard_url} style={button}>
            Go to Dashboard
          </Button>
        </Section>
      )}

      <Text style={paragraph}>
        Thank you for being part of our community. We are excited to have you as a Pioneer!
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
  backgroundColor: '#f5f3ff',
  borderLeft: '4px solid #7c3aed',
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
  backgroundColor: '#7c3aed',
  color: '#ffffff',
  padding: '12px 24px',
  borderRadius: '8px',
  textDecoration: 'none',
  display: 'inline-block',
  fontWeight: 'bold',
}
