# Email System DNS Configuration Guide

## Overview

This guide explains how to configure DNS records for email deliverability using Resend. These DNS records are required for maximum email deliverability and to prevent emails from being marked as spam.

## Required DNS Records

### 1. SPF (Sender Policy Framework)

**Purpose:** Authorizes Resend to send emails on behalf of your domain

**DNS Record:**
```
Type: TXT
Name: @ (or your domain name)
Value: v=spf1 include:resend.com -all
TTL: 3600 (or default)
```

**How to Add:**
1. Log in to your domain registrar (GoDaddy, Namecheap, etc.)
2. Navigate to DNS Management
3. Add a new TXT record with the value above
4. Save changes

**Verification:**
- Wait 5-10 minutes for DNS propagation
- Use online SPF checker: https://mxtoolbox.com/spf.aspx

---

### 2. DKIM (DomainKeys Identified Mail)

**Purpose:** Cryptographically signs emails to prove authenticity

**DNS Record:**
```
Type: TXT
Name: resend._domainkey (or provided by Resend)
Value: [Provided by Resend after domain verification]
TTL: 3600 (or default)
```

**How to Add:**
1. In Resend Dashboard, go to Domains
2. Add your domain (akomaylessonplanna.com)
3. Resend will provide the DKIM record
4. Add the TXT record to your DNS
5. Resend will verify automatically

**Note:** The exact DKIM record value is unique per Resend account and will be provided by Resend.

---

### 3. DMARC (Domain-based Message Authentication, Reporting & Conformance)

**Purpose:** Tells receiving servers what to do with emails that fail SPF/DKIM checks

**DNS Record (Month 1 - Monitoring):**
```
Type: TXT
Name: _dmarc
Value: v=DMARC1; p=none; rua=mailto:dmarc@akomaylessonplanna.com
TTL: 3600 (or default)
```

**Rollout Schedule:**
- **Month 1:** `p=none` (monitoring only, no blocking)
- **Month 2:** `p=quarantine` (send to spam folder if fails)
- **Month 4:** `p=reject` (block fake emails completely)

**How to Add:**
1. Add TXT record with name `_dmarc`
2. Start with `p=none` for monitoring
3. Review DMARC reports monthly
4. Gradually tighten policy as confidence grows

---

## Step-by-Step Setup Instructions

### Step 1: Verify Domain in Resend

1. Log in to Resend Dashboard: https://resend.com/domains
2. Click "Add Domain"
3. Enter: `akomaylessonplanna.com`
4. Resend will provide DNS records to add

### Step 2: Add DNS Records

1. Log in to your domain registrar
2. Navigate to DNS Management
3. Add the three TXT records provided by Resend:
   - SPF record
   - DKIM record (resend._domainkey)
   - DMARC record (_dmarc)

### Step 3: Wait for Verification

1. DNS propagation can take 5 minutes to 48 hours
2. Resend will automatically verify once records are detected
3. Check Resend Dashboard for verification status

### Step 4: Test Email Sending

1. Once verified, test sending an email
2. Check email headers for SPF/DKIM pass
3. Monitor DMARC reports

---

## Verification Commands

After adding DNS records, verify they're correct:

```bash
# Check SPF record
dig TXT akomaylessonplanna.com | grep spf

# Check DKIM record
dig TXT resend._domainkey.akomaylessonplanna.com

# Check DMARC record
dig TXT _dmarc.akomaylessonplanna.com
```

---

## Environment Variables

After DNS setup, ensure these are set:

```env
RESEND_API_KEY=re_xxxxxxxxxxxxx
RESEND_FROM_EMAIL=noreply@akomaylessonplanna.com
RESEND_WEBHOOK_SECRET=your_webhook_secret
```

---

## Troubleshooting

### Emails Going to Spam

1. **Check SPF/DKIM:** Use https://mxtoolbox.com/emailhealth/
2. **Verify DMARC:** Check DMARC reports
3. **Warm up domain:** Start with low volume, gradually increase
4. **Check content:** Avoid spam trigger words
5. **Monitor bounce rate:** Keep bounce rate < 5%

### DNS Not Propagating

1. Wait 24-48 hours (rare, usually 5-10 minutes)
2. Clear DNS cache: `ipconfig /flushdns` (Windows) or `sudo dscacheutil -flushcache` (Mac)
3. Check with different DNS servers
4. Verify record syntax is correct

### Resend Verification Failing

1. Double-check DNS record values match exactly
2. Ensure TTL is not too high (use 3600 or lower)
3. Wait for full DNS propagation
4. Contact Resend support if still failing after 48 hours

---

## Cost Considerations

- **Resend Free Tier:** 3,000 emails/month
- **Resend Pro:** $20/month for 50,000 emails
- **Estimated Year 1:** ~$360 (~₱21,600)

---

## Next Steps

1. ✅ Set up Resend account
2. ⏳ Add DNS records (this guide)
3. ⏳ Verify domain in Resend
4. ⏳ Test email sending
5. ⏳ Monitor DMARC reports
6. ⏳ Gradually tighten DMARC policy

---

**Note:** DNS configuration is a manual process that must be done by the domain administrator. This cannot be automated through code.
