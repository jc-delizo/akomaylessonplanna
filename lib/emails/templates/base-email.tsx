import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components'
import * as React from 'react'

interface BaseEmailProps {
  preview?: string
  children: React.ReactNode
  logoUrl?: string
  platformName?: string
  platformUrl?: string
  supportEmail?: string
  unsubscribeLink?: string
  preferencesLink?: string
  currentYear?: number
}

export function BaseEmail({
  preview,
  children,
  logoUrl = 'https://akomaylessonplanna.com/logo.png',
  platformName = 'AKOMAYLESSONPLANNA',
  platformUrl = 'https://akomaylessonplanna.com',
  supportEmail = 'support@akomaylessonplanna.com',
  unsubscribeLink,
  preferencesLink = 'https://akomaylessonplanna.com/settings/notifications',
  currentYear = new Date().getFullYear(),
}: BaseEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>{preview || 'Email from AKOMAYLESSONPLANNA'}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Link href={platformUrl} style={logoLink}>
              {logoUrl && (
                <Img
                  src={logoUrl}
                  width="40"
                  height="40"
                  alt={platformName}
                  style={logo}
                />
              )}
              <Heading style={logoText}>{platformName}</Heading>
            </Link>
          </Section>

          {/* Main Content */}
          <Section style={content}>{children}</Section>

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              © {currentYear} {platformName}. All rights reserved.
            </Text>
            <Text style={footerText}>
              <Link href={platformUrl} style={footerLink}>
                Visit our website
              </Link>
              {' • '}
              <Link href={preferencesLink} style={footerLink}>
                Email Preferences
              </Link>
              {unsubscribeLink && (
                <>
                  {' • '}
                  <Link href={unsubscribeLink} style={footerLink}>
                    Unsubscribe
                  </Link>
                </>
              )}
            </Text>
            <Text style={footerText}>
              Questions? Contact us at{' '}
              <Link href={`mailto:${supportEmail}`} style={footerLink}>
                {supportEmail}
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

// Styles
const main = {
  backgroundColor: '#f6f9fc',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
}

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
  maxWidth: '600px',
}

const header = {
  padding: '32px 24px',
  borderBottom: '1px solid #e9ecef',
}

const logoLink = {
  display: 'flex',
  alignItems: 'center',
  textDecoration: 'none',
  color: '#1a202c',
}

const logo = {
  marginRight: '12px',
}

const logoText = {
  fontSize: '24px',
  fontWeight: 'bold',
  margin: 0,
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  backgroundClip: 'text',
}

const content = {
  padding: '24px',
}

const footer = {
  padding: '24px',
  borderTop: '1px solid #e9ecef',
  backgroundColor: '#f8f9fa',
}

const footerText = {
  fontSize: '12px',
  lineHeight: '16px',
  color: '#6c757d',
  margin: '4px 0',
  textAlign: 'center' as const,
}

const footerLink = {
  color: '#667eea',
  textDecoration: 'underline',
}
