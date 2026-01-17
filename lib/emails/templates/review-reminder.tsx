import {
  Button,
  Heading,
  Section,
  Text,
} from '@react-email/components'
import { BaseEmail } from './base-email'
import * as React from 'react'

interface ReviewReminderEmailProps {
  user_name?: string
  product_title?: string
  product_url?: string
  review_link?: string
  platform_url?: string
}

export function ReviewReminderEmail({
  user_name = 'Valued Customer',
  product_title,
  product_url,
  review_link,
  platform_url = 'https://akomaylessonplanna.com',
}: ReviewReminderEmailProps) {
  return (
    <BaseEmail
      preview={`How was your purchase? Share your feedback!`}
      platformUrl={platform_url}
    >
      <Heading style={heading}>How Was Your Purchase?</Heading>

      <Text style={paragraph}>
        Hi {user_name},
      </Text>

      <Text style={paragraph}>
        We hope you're enjoying your purchase! Your feedback helps other teachers make informed decisions.
      </Text>

      {product_title && (
        <Section style={infoBox}>
          <Text style={infoText}>
            <strong>Product:</strong> {product_title}
          </Text>
        </Section>
      )}

      {review_link && (
        <Section style={buttonSection}>
          <Button href={review_link} style={button}>
            Leave a Review
          </Button>
        </Section>
      )}

      <Text style={paragraph}>
        Your review helps the seller improve and helps other teachers find quality resources.
      </Text>

      <Text style={note}>
        This review link will expire in 7 days. Share your feedback while it's fresh in your mind!
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
