import {
  Heading,
  Section,
  Text,
} from '@react-email/components'
import { BaseEmail } from './base-email'
import * as React from 'react'

interface PaymentSuccessfulEmailProps {
  user_name?: string
  order_id?: string
  order_total?: string
  payment_method?: string
  download_link?: string
  platform_url?: string
}

export function PaymentSuccessfulEmail({
  user_name = 'Valued Customer',
  order_id,
  order_total,
  payment_method,
  download_link,
  platform_url = 'https://akomaylessonplanna.com',
}: PaymentSuccessfulEmailProps) {
  return (
    <BaseEmail
      preview={`Payment successful for order #${order_id}!`}
      platformUrl={platform_url}
    >
      <Heading style={heading}>Payment Successful! ✅</Heading>

      <Text style={paragraph}>
        Hi {user_name},
      </Text>

      <Text style={paragraph}>
        Great news! Your payment has been successfully processed.
      </Text>

      <Section style={infoBox}>
        <Text style={infoText}>
          <strong>Order ID:</strong> {order_id || 'N/A'}
        </Text>
        <Text style={infoText}>
          <strong>Amount Paid:</strong> {order_total || '₱0.00'}
        </Text>
        <Text style={infoText}>
          <strong>Payment Method:</strong> {payment_method || 'N/A'}
        </Text>
      </Section>

      {download_link && (
        <Section style={buttonSection}>
          <a href={download_link} style={button}>
            Download Your Files Now
          </a>
        </Section>
      )}

      <Text style={paragraph}>
        Your order is now complete and ready for download. You can access your files from your{' '}
        <a href={`${platform_url}/library`} style={link}>
          Library
        </a> at any time.
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

const link = {
  color: '#667eea',
  textDecoration: 'underline',
}
