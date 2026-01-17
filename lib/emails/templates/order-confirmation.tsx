import {
  Button,
  Heading,
  Section,
  Text,
} from '@react-email/components'
import { BaseEmail } from './base-email'
import * as React from 'react'

interface OrderConfirmationEmailProps {
  user_name?: string
  order_id?: string
  order_date?: string
  order_total?: string
  order_items?: Array<{ title: string; price: string }>
  payment_method?: string
  download_link?: string
  platform_url?: string
}

export function OrderConfirmationEmail({
  user_name = 'Valued Customer',
  order_id,
  order_date,
  order_total,
  order_items = [],
  payment_method,
  download_link,
  platform_url = 'https://akomaylessonplanna.com',
}: OrderConfirmationEmailProps) {
  return (
    <BaseEmail
      preview={`Your order #${order_id} has been confirmed!`}
      platformUrl={platform_url}
    >
      <Heading style={heading}>Order Confirmed! 🎉</Heading>

      <Text style={paragraph}>
        Hi {user_name},
      </Text>

      <Text style={paragraph}>
        Thank you for your purchase! Your order has been confirmed and we're processing it now.
      </Text>

      <Section style={infoBox}>
        <Text style={infoText}>
          <strong>Order ID:</strong> {order_id || 'N/A'}
        </Text>
        <Text style={infoText}>
          <strong>Order Date:</strong> {order_date || 'N/A'}
        </Text>
        <Text style={infoText}>
          <strong>Payment Method:</strong> {payment_method || 'N/A'}
        </Text>
        <Text style={infoText}>
          <strong>Total Amount:</strong> {order_total || '₱0.00'}
        </Text>
      </Section>

      {order_items.length > 0 && (
        <Section style={itemsSection}>
          <Text style={sectionHeading}>Order Items:</Text>
          {order_items.map((item, index) => (
            <Text key={index} style={itemText}>
              • {item.title} - {item.price}
            </Text>
          ))}
        </Section>
      )}

      {download_link && (
        <Section style={buttonSection}>
          <Button href={download_link} style={button}>
            Download Your Files
          </Button>
        </Section>
      )}

      <Text style={paragraph}>
        You can also access your downloads anytime from your{' '}
        <a href={`${platform_url}/library`} style={link}>
          Library
        </a>.
      </Text>

      <Text style={paragraph}>
        If you have any questions, please don't hesitate to contact our support team.
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

const itemsSection = {
  marginBottom: '24px',
}

const sectionHeading = {
  fontSize: '18px',
  fontWeight: 'bold',
  color: '#1a202c',
  marginBottom: '12px',
}

const itemText = {
  fontSize: '14px',
  lineHeight: '20px',
  color: '#4a5568',
  marginBottom: '8px',
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
