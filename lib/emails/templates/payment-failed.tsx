import {
  Button,
  Heading,
  Section,
  Text,
} from '@react-email/components'
import { BaseEmail } from './base-email'
import * as React from 'react'

interface PaymentFailedEmailProps {
  user_name?: string
  order_id?: string
  order_total?: string
  payment_method?: string
  retry_link?: string
  platform_url?: string
}

export function PaymentFailedEmail({
  user_name = 'Valued Customer',
  order_id,
  order_total,
  payment_method,
  retry_link,
  platform_url = 'https://akomaylessonplanna.com',
}: PaymentFailedEmailProps) {
  return (
    <BaseEmail
      preview={`Payment failed for order #${order_id}`}
      platformUrl={platform_url}
    >
      <Heading style={heading}>Payment Failed</Heading>

      <Text style={paragraph}>
        Hi {user_name},
      </Text>

      <Text style={paragraph}>
        We encountered an issue processing your payment for order #{order_id}.
      </Text>

      <Section style={infoBox}>
        <Text style={infoText}>
          <strong>Order ID:</strong> {order_id || 'N/A'}
        </Text>
        <Text style={infoText}>
          <strong>Amount:</strong> {order_total || '₱0.00'}
        </Text>
        <Text style={infoText}>
          <strong>Payment Method:</strong> {payment_method || 'N/A'}
        </Text>
      </Section>

      <Text style={paragraph}>
        <strong>What happened?</strong>
      </Text>
      <Text style={paragraph}>
        Your payment could not be processed. This might be due to:
      </Text>
      <Text style={listItem}>• Insufficient funds</Text>
      <Text style={listItem}>• Incorrect payment details</Text>
      <Text style={listItem}>• Network connectivity issues</Text>
      <Text style={listItem}>• Payment gateway timeout</Text>

      {retry_link && (
        <Section style={buttonSection}>
          <Button href={retry_link} style={button}>
            Retry Payment
          </Button>
        </Section>
      )}

      <Text style={paragraph}>
        You can also try again from your{' '}
        <a href={`${platform_url}/checkout`} style={link}>
          Checkout page
        </a> or contact our support team if the issue persists.
      </Text>

      <Text style={paragraph}>
        Your order has been saved and you can complete the payment anytime.
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
  borderLeft: '4px solid #ef4444',
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

const link = {
  color: '#667eea',
  textDecoration: 'underline',
}
