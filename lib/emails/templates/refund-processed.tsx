import {
  Heading,
  Section,
  Text,
} from '@react-email/components'
import { BaseEmail } from './base-email'
import * as React from 'react'

interface RefundProcessedEmailProps {
  user_name?: string
  order_id?: string
  refund_amount?: string
  product_title?: string
  platform_url?: string
}

export function RefundProcessedEmail({
  user_name = 'Valued Customer',
  order_id,
  refund_amount,
  product_title,
  platform_url = 'https://akomaylessonplanna.com',
}: RefundProcessedEmailProps) {
  return (
    <BaseEmail
      preview={`Refund processed for order #${order_id}`}
      platformUrl={platform_url}
    >
      <Heading style={heading}>Refund Processed</Heading>

      <Text style={paragraph}>
        Hi {user_name},
      </Text>

      <Text style={paragraph}>
        Your refund request has been processed successfully.
      </Text>

      <Section style={infoBox}>
        {order_id && (
          <Text style={infoText}>
            <strong>Order ID:</strong> {order_id}
          </Text>
        )}
        {product_title && (
          <Text style={infoText}>
            <strong>Product:</strong> {product_title}
          </Text>
        )}
        {refund_amount && (
          <Text style={infoText}>
            <strong>Refund Amount:</strong> {refund_amount}
          </Text>
        )}
      </Section>

      <Text style={paragraph}>
        The refund has been processed and should appear in your account within 3-5 business days, depending on your payment method.
      </Text>

      <Text style={paragraph}>
        If you have any questions about this refund, please contact our support team.
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
  backgroundColor: '#f7fafc',
  borderLeft: '4px solid #667eea',
  padding: '16px',
  marginBottom: '24px',
}

const infoText = {
  fontSize: '14px',
  lineHeight: '20px',
  color: '#1a202c',
  margin: '4px 0',
}
