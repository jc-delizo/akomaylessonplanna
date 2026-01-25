'use client'

import { useState, useEffect } from 'react'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { CreditCard, Smartphone, Wallet } from 'lucide-react'
import { toast } from 'sonner'

interface PaymentMethodsProps {
  initialData?: {
    gcash_number?: string | null
    maya_number?: string | null
  }
}

export function PaymentMethods({ initialData }: PaymentMethodsProps) {
  const [gcashNumber, setGcashNumber] = useState(initialData?.gcash_number || '')
  const [mayaNumber, setMayaNumber] = useState(initialData?.maya_number || '')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (initialData) {
      setGcashNumber(initialData.gcash_number || '')
      setMayaNumber(initialData.maya_number || '')
    }
  }, [initialData])

  const formatPhoneNumber = (value: string) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, '')
    
    // Format as 09XX-XXX-XXXX if 11 digits
    if (digits.length === 11 && digits.startsWith('09')) {
      return `${digits.slice(0, 4)}-${digits.slice(4, 7)}-${digits.slice(7)}`
    }
    
    return digits
  }

  const validatePhoneNumber = (number: string): boolean => {
    if (!number) return true // Optional
    const phoneRegex = /^09\d{2}[\s-]?\d{3}[\s-]?\d{4}$|^09\d{9}$/
    return phoneRegex.test(number)
  }

  const handleSave = async () => {
    // Validate GCash number (required for withdrawals)
    if (!gcashNumber.trim()) {
      toast.error('GCash number is required for withdrawals')
      return
    }

    if (!validatePhoneNumber(gcashNumber)) {
      toast.error('Invalid GCash number format. Use format: 09XX-XXX-XXXX or 09XXXXXXXXX')
      return
    }

    if (mayaNumber && !validatePhoneNumber(mayaNumber)) {
      toast.error('Invalid Maya number format. Use format: 09XX-XXX-XXXX or 09XXXXXXXXX')
      return
    }

    try {
      setSaving(true)
      const response = await fetch('/api/seller/settings/payment-methods', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gcash_number: gcashNumber.trim() || null,
          maya_number: mayaNumber.trim() || null,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update payment methods')
      }

      toast.success('Payment methods updated successfully')
    } catch (error: any) {
      console.error('Error updating payment methods:', error)
      toast.error(error.message || 'Failed to update payment methods')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-100">
            <Wallet className="size-5 text-blue-600" />
          </div>
          <div>
            <CardTitle>Payment Methods</CardTitle>
            <CardDescription>
              Set up your payment methods to receive withdrawals. GCash is required.
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* GCash Number */}
        <div className="space-y-3 p-4 bg-orange-50/50 rounded-lg border border-orange-100">
          <div className="flex items-center gap-2">
            <Smartphone className="size-5 text-[#ff7200]" />
            <Label htmlFor="gcash-number" className="text-base font-medium">
              GCash Number *
            </Label>
          </div>
          <Input
            id="gcash-number"
            value={gcashNumber}
            onChange={(e) => setGcashNumber(formatPhoneNumber(e.target.value))}
            placeholder="09XX-XXX-XXXX"
            maxLength={13}
            className="h-10 bg-white"
          />
          <p className="text-xs text-gray-600">
            Required for withdrawals. Format: 09XX-XXX-XXXX or 09XXXXXXXXX
          </p>
        </div>

        <Separator />

        {/* Maya Number */}
        <div className="space-y-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex items-center gap-2">
            <CreditCard className="size-5 text-gray-600" />
            <Label htmlFor="maya-number" className="text-base font-medium">
              Maya Number
              <span className="text-xs font-normal text-gray-500 ml-1">(Optional)</span>
            </Label>
          </div>
          <Input
            id="maya-number"
            value={mayaNumber}
            onChange={(e) => setMayaNumber(formatPhoneNumber(e.target.value))}
            placeholder="09XX-XXX-XXXX"
            maxLength={13}
            className="h-10 bg-white"
          />
          <p className="text-xs text-gray-600">
            Optional. Format: 09XX-XXX-XXXX or 09XXXXXXXXX
          </p>
        </div>
      </CardContent>

      <CardFooter className="border-t bg-gray-50/50">
        <Button onClick={handleSave} disabled={saving} className="ml-auto">
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </CardFooter>
    </Card>
  )
}
