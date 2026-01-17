import {
  Button,
  Heading,
  Section,
  Text,
} from '@react-email/components'
import { BaseEmail } from './base-email'
import * as React from 'react'

interface CartAbandonmentEmailProps {
  user_name?: string
  cart_items?: Array<{ title: string; price: string }>
  total_amount?: string
  cart_link?: string
  platform_url?: string
}

export function CartAbandonmentEmail({
  user_name = 'Valued Customer',
  cart_items = [],
  total_amount,
  cart_link,
  platform_url = 'https://akomaylessonplanna.com',
}: CartAbandonmentEmailProps) {
  return (
    <BaseEmail
      preview={`Don't forget your cart! Complete your purchase.`}
      platformUrl={platform_url}
    >
      <Heading style={heading}>You Left Items in Your Cart</Heading>

      <Text style={paragraph}>
        Hi {user_name},
      </Text>

      <Text style={paragraph}>
        We noticed you added some items to your cart but didn't complete your purchase. Don't worry, we've saved them for you!
      </Text>

      {cart_items.length > 0 && (
        <Section style={itemsSection}>
          <Text style={sectionHeading}>Your Cart Items:</Text>
          {cart_items.map((item, index) => (
            <Text key={index} style={itemText}>
              • {item.title} - {item.price}
            </Text>
          ))}
          {total_amount && (
            <Text style={totalText}>
              <strong>Total: {total_amount}</strong>
            </Text>
          )}
        </Section>
      )}

      {cart_link && (
        <Section style={buttonSection}>
          <Button href={cart_link} style={button}>
            Complete Your Purchase
          </Button>
        </Section>
      )}

      <Text style={paragraph}>
        These items are waiting for you. Complete your purchase now to secure your downloads!
      </Text>

      <Text style={note}>
        This cart will expire in 7 days. Complete your purchase soon to avoid missing out!
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

const itemsSection = {
  backgroundColor: '#f7fafc',
  borderLeft: '4px solid #667eea',
  padding: '16px',
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

const totalText = {
  fontSize: '16px',
  lineHeight: '24px',
  color: '#1a202c',
  marginTop: '12px',
  paddingTop: '12px',
  borderTop: '1px solid #e9ecef',
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

const note = {
  fontSize: '14px',
  lineHeight: '20px',
  color: '#6c757d',
  fontStyle: 'italic',
  marginTop: '16px',
}
