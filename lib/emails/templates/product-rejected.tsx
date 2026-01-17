import {
  Button,
  Heading,
  Section,
  Text,
} from '@react-email/components'
import { BaseEmail } from './base-email'
import * as React from 'react'

interface ProductRejectedEmailProps {
  user_name?: string
  product_title?: string
  rejection_reason?: string
  edit_link?: string
  platform_url?: string
}

export function ProductRejectedEmail({
  user_name = 'Seller',
  product_title,
  rejection_reason,
  edit_link,
  platform_url = 'https://akomaylessonplanna.com',
}: ProductRejectedEmailProps) {
  return (
    <BaseEmail
      preview={`Action needed: Your product "${product_title}" needs changes`}
      platformUrl={platform_url}
    >
      <Heading style={heading}>Product Needs Changes</Heading>

      <Text style={paragraph}>
        Hi {user_name},
      </Text>

      <Text style={paragraph}>
        We've reviewed your product submission, but it needs some changes before it can be approved.
      </Text>

      {product_title && (
        <Section style={infoBox}>
          <Text style={infoText}>
            <strong>Product:</strong> {product_title}
          </Text>
        </Section>
      )}

      {rejection_reason && (
        <Section style={reasonBox}>
          <Text style={sectionHeading}>Reason for Rejection:</Text>
          <Text style={reasonText}>{rejection_reason}</Text>
        </Section>
      )}

      <Text style={paragraph}>
        <strong>What to do next:</strong>
      </Text>
      <Text style={listItem}>• Review the feedback above</Text>
      <Text style={listItem}>• Make the necessary changes</Text>
      <Text style={listItem}>• Resubmit your product for review</Text>

      {edit_link && (
        <Section style={buttonSection}>
          <Button href={edit_link} style={button}>
            Edit Product
          </Button>
        </Section>
      )}

      <Text style={paragraph}>
        If you have any questions about the feedback, please contact our support team.
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

const reasonBox = {
  backgroundColor: '#fef2f2',
  borderLeft: '4px solid #ef4444',
  padding: '16px',
  marginBottom: '24px',
}

const sectionHeading = {
  fontSize: '16px',
  fontWeight: 'bold',
  color: '#1a202c',
  marginBottom: '8px',
}

const reasonText = {
  fontSize: '14px',
  lineHeight: '20px',
  color: '#4a5568',
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
