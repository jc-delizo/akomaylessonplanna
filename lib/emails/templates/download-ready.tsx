import {
  Button,
  Heading,
  Section,
  Text,
} from '@react-email/components'
import { BaseEmail } from './base-email'
import * as React from 'react'

interface DownloadReadyEmailProps {
  user_name?: string
  order_id?: string
  product_title?: string
  download_link?: string
  platform_url?: string
}

export function DownloadReadyEmail({
  user_name = 'Valued Customer',
  order_id,
  product_title,
  download_link,
  platform_url = 'https://akomaylessonplanna.com',
}: DownloadReadyEmailProps) {
  return (
    <BaseEmail
      preview={`Your download is ready! ${product_title || ''}`}
      platformUrl={platform_url}
    >
      <Heading style={heading}>Your Download is Ready! 📥</Heading>

      <Text style={paragraph}>
        Hi {user_name},
      </Text>

      <Text style={paragraph}>
        Great news! Your purchase is ready for download.
      </Text>

      {product_title && (
        <Section style={infoBox}>
          <Text style={infoText}>
            <strong>Product:</strong> {product_title}
          </Text>
          {order_id && (
            <Text style={infoText}>
              <strong>Order ID:</strong> {order_id}
            </Text>
          )}
        </Section>
      )}

      {download_link && (
        <Section style={buttonSection}>
          <Button href={download_link} style={button}>
            Download Now
          </Button>
        </Section>
      )}

      <Text style={paragraph}>
        You can also access this download anytime from your{' '}
        <a href={`${platform_url}/library`} style={link}>
          Library
        </a>.
      </Text>

      <Text style={note}>
        <strong>Note:</strong> Download links are valid for 24 hours. After that, you can still access your files from your Library.
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

const link = {
  color: '#667eea',
  textDecoration: 'underline',
}

const note = {
  fontSize: '14px',
  lineHeight: '20px',
  color: '#6c757d',
  fontStyle: 'italic',
  marginTop: '16px',
}
