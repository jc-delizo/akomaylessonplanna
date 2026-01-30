import {
  Heading,
  Section,
  Text,
} from '@react-email/components'
import { BaseEmail } from './base-email'
import * as React from 'react'

interface PioneerRemovedEmailProps {
  user_name?: string
  reason?: string
  platform_url?: string
}

export function PioneerRemovedEmail({
  user_name = 'Seller',
  reason = '',
  platform_url = 'https://akomaylessonplanna.com',
}: PioneerRemovedEmailProps) {
  return (
    <BaseEmail
      preview="Changes to your Pioneer status"
      platformUrl={platform_url}
    >
      <Heading style={heading}>Changes to your Pioneer status</Heading>

      <Text style={paragraph}>
        Hi {user_name},
      </Text>

      <Text style={paragraph}>
        Your Pioneer Seller status on Ako may lesson plan na! has been removed. Your commission rate will revert to the standard 20% for new sales. Your existing products and sales are unaffected.
      </Text>

      {reason && (
        <Section style={infoBox}>
          <Text style={infoText}>
            <strong>Reason:</strong> {reason}
          </Text>
        </Section>
      )}

      <Text style={paragraph}>
        If you have questions, please contact our support team.
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
  backgroundColor: '#fef2f2',
  borderLeft: '4px solid #dc2626',
  padding: '16px',
  marginBottom: '24px',
}

const infoText = {
  fontSize: '14px',
  lineHeight: '20px',
  color: '#1a202c',
  margin: '4px 0',
}
