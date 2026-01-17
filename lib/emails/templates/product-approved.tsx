import {
  Button,
  Heading,
  Section,
  Text,
} from '@react-email/components'
import { BaseEmail } from './base-email'
import * as React from 'react'

interface ProductApprovedEmailProps {
  user_name?: string
  product_title?: string
  product_url?: string
  platform_url?: string
}

export function ProductApprovedEmail({
  user_name = 'Seller',
  product_title,
  product_url,
  platform_url = 'https://akomaylessonplanna.com',
}: ProductApprovedEmailProps) {
  return (
    <BaseEmail
      preview={`Your product "${product_title}" has been approved! 🎉`}
      platformUrl={platform_url}
    >
      <Heading style={heading}>Product Approved! 🎉</Heading>

      <Text style={paragraph}>
        Hi {user_name},
      </Text>

      <Text style={paragraph}>
        Great news! Your product has been approved and is now live on the marketplace.
      </Text>

      {product_title && (
        <Section style={infoBox}>
          <Text style={infoText}>
            <strong>Product:</strong> {product_title}
          </Text>
        </Section>
      )}

      <Text style={paragraph}>
        <strong>Tips for your first sale:</strong>
      </Text>
      <Text style={listItem}>• Share to Facebook teacher groups</Text>
      <Text style={listItem}>• Pin to your profile</Text>
      <Text style={listItem}>• Add detailed descriptions and previews</Text>
      <Text style={listItem}>• Respond to buyer questions promptly</Text>

      {product_url && (
        <Section style={buttonSection}>
          <Button href={product_url} style={button}>
            View Your Product
          </Button>
        </Section>
      )}

      <Text style={paragraph}>
        Good luck with your sales! 🍀
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
