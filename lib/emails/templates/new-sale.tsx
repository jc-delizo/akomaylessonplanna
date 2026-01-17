import {
  Button,
  Heading,
  Section,
  Text,
} from '@react-email/components'
import { BaseEmail } from './base-email'
import * as React from 'react'

interface NewSaleEmailProps {
  user_name?: string
  product_title?: string
  sale_amount?: string
  earnings?: string
  buyer_name?: string
  product_url?: string
  platform_url?: string
}

export function NewSaleEmail({
  user_name = 'Seller',
  product_title,
  sale_amount,
  earnings,
  buyer_name,
  product_url,
  platform_url = 'https://akomaylessonplanna.com',
}: NewSaleEmailProps) {
  return (
    <BaseEmail
      preview={`You made a sale! 🎉 ${sale_amount || ''}`}
      platformUrl={platform_url}
    >
      <Heading style={heading}>You Made a Sale! 🎉</Heading>

      <Text style={paragraph}>
        Hi {user_name},
      </Text>

      <Text style={paragraph}>
        Congratulations! Someone just purchased your product.
      </Text>

      <Section style={infoBox}>
        {product_title && (
          <Text style={infoText}>
            <strong>Product:</strong> {product_title}
          </Text>
        )}
        {sale_amount && (
          <Text style={infoText}>
            <strong>Sale Amount:</strong> {sale_amount}
          </Text>
        )}
        {earnings && (
          <Text style={infoText}>
            <strong>Your Earnings:</strong> {earnings}
          </Text>
        )}
        {buyer_name && (
          <Text style={infoText}>
            <strong>Buyer:</strong> {buyer_name}
          </Text>
        )}
      </Section>

      <Text style={paragraph}>
        Your earnings will be available for withdrawal after the 3-day hold period.
      </Text>

      {product_url && (
        <Section style={buttonSection}>
          <Button href={product_url} style={button}>
            View Product
          </Button>
        </Section>
      )}

      <Text style={paragraph}>
        Keep up the great work! 🚀
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
