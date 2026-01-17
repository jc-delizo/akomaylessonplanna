'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'
import { ArrowLeft, CreditCard, Smartphone } from 'lucide-react'

interface CartItem {
  id: string
  product_id: string
  product: {
    id: string
    title: string
    price: number
    cover_image_url?: string
    seller: {
      id: string
      name: string
      username: string
    }
  }
}

export default function CheckoutPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [step, setStep] = useState(1)
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<'gcash' | 'maya' | null>(null)
  const [mobileNumber, setMobileNumber] = useState('')
  const supabase = createClient()

  useEffect(() => {
    loadCheckoutItems()
  }, [])

  const loadCheckoutItems = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        // Guest user - redirect to login with return URL
        const currentUrl = window.location.pathname + window.location.search
        router.push(`/login?redirect=${encodeURIComponent(currentUrl)}`)
        return
      }

      // Get items from query params (for Buy Now) or fetch from cart
      const itemsParam = searchParams.get('items')
      if (itemsParam) {
        // Buy Now flow - items are cart item IDs
        const itemIds = itemsParam.split(',').filter(Boolean)
        setSelectedItemIds(itemIds)

        // Fetch cart items
        const response = await fetch('/api/cart')
        if (response.ok) {
          const data = await response.json()
          const selectedItems = data.items.filter((item: CartItem) =>
            itemIds.includes(item.id)
          )
          setCartItems(selectedItems)
        }
      } else {
        // Regular checkout - get all cart items
        const response = await fetch('/api/cart')
        if (response.ok) {
          const data = await response.json()
          setCartItems(data.items || [])
          setSelectedItemIds(data.items.map((item: CartItem) => item.id))
        }
      }
    } catch (error) {
      console.error('Error loading checkout items:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleContinueToPayment = () => {
    if (cartItems.length === 0) {
      alert('Please select items to checkout')
      return
    }
    setStep(2)
  }

  const handlePaymentMethodSelect = (method: 'gcash' | 'maya') => {
    setPaymentMethod(method)
  }

  const handlePayNow = async () => {
    if (!paymentMethod) {
      alert('Please select a payment method')
      return
    }

    if (!mobileNumber || mobileNumber.length < 10) {
      alert('Please enter a valid mobile number')
      return
    }

    setProcessing(true)
    try {
      // Create order
      const orderResponse = await fetch('/api/checkout/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          item_ids: selectedItemIds,
        }),
      })

      if (!orderResponse.ok) {
        const error = await orderResponse.json()
        throw new Error(error.error || 'Failed to create order')
      }

      const orderData = await orderResponse.json()

      // Select payment method
      const paymentResponse = await fetch('/api/checkout/select-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: orderData.order_id,
          payment_method: paymentMethod,
          mobile_number: mobileNumber,
        }),
      })

      if (!paymentResponse.ok) {
        const error = await paymentResponse.json()
        throw new Error(error.error || 'Failed to process payment')
      }

      const paymentData = await paymentResponse.json()

      // Redirect to payment instructions or thank you page
      // For now, redirect to order success page (payment will be processed via webhook)
      router.push(`/orders/${orderData.order_id}/success`)
    } catch (error: any) {
      console.error('Error processing payment:', error)
      alert(error.message || 'Failed to process payment. Please try again.')
    } finally {
      setProcessing(false)
    }
  }

  const subtotal = cartItems.reduce((sum, item) => sum + item.product.price, 0)

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading checkout...</p>
          </div>
        </div>
      </div>
    )
  }

  if (cartItems.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="p-12 text-center">
          <h2 className="text-2xl font-semibold mb-2">No items to checkout</h2>
          <p className="text-gray-600 mb-6">
            Your cart is empty or the selected items are no longer available.
          </p>
          <Button asChild>
            <Link href="/cart">Go to Cart</Link>
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Mobile: Sticky Pay Button */}
      {step === 2 && paymentMethod && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t p-4 z-50 shadow-lg">
          <Button
            className="w-full"
            size="lg"
            onClick={handlePayNow}
            disabled={!paymentMethod || !mobileNumber || processing}
            style={{
              backgroundColor: paymentMethod === 'gcash' ? '#0066CC' : paymentMethod === 'maya' ? '#FF6B35' : undefined,
            }}
          >
            {processing ? 'Processing...' : `Pay Now ₱${subtotal.toFixed(2)}`}
          </Button>
        </div>
      )}
      {/* Progress Indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${
                step >= 1
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-200 text-gray-600'
              }`}
            >
              1
            </div>
            <span className={step >= 1 ? 'font-semibold' : 'text-gray-600'}>
              Review Order
            </span>
          </div>
          <div className="flex-1 h-1 mx-4 bg-gray-200">
            <div
              className={`h-full transition-all ${
                step >= 2 ? 'bg-purple-600' : 'bg-gray-200'
              }`}
              style={{ width: step >= 2 ? '100%' : '0%' }}
            />
          </div>
          <div className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${
                step >= 2
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-200 text-gray-600'
              }`}
            >
              2
            </div>
            <span className={step >= 2 ? 'font-semibold' : 'text-gray-600'}>
              Payment Method
            </span>
          </div>
        </div>
        <p className="text-center text-sm text-gray-600">
          Step {step} of 2
        </p>
      </div>

      {step === 1 && (
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" asChild>
              <Link href="/cart">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Cart
              </Link>
            </Button>
          </div>

          <Card className="p-6">
            <h2 className="text-2xl font-semibold mb-6">Order Summary</h2>

            {/* Items List */}
            <div className="space-y-4 mb-6">
              {cartItems.map((item) => (
                <div key={item.id} className="flex gap-4 pb-4 border-b last:border-0">
                  <div className="w-20 h-20 bg-gray-100 rounded-md overflow-hidden flex-shrink-0">
                    {item.product.cover_image_url ? (
                      <img
                        src={item.product.cover_image_url}
                        alt={item.product.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <svg
                          className="w-8 h-8"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <Link
                      href={`/products/${item.product.id}`}
                      className="font-semibold hover:text-purple-600 transition-colors"
                    >
                      {item.product.title}
                    </Link>
                    <p className="text-sm text-gray-600">
                      Seller: {item.product.seller.name}
                    </p>
                    <p className="text-lg font-bold text-purple-600 mt-1">
                      ₱{item.product.price.toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="border-t pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span>Subtotal ({cartItems.length} {cartItems.length === 1 ? 'item' : 'items'})</span>
                <span>₱{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xl font-bold pt-2">
                <span>Total</span>
                <span className="text-purple-600">₱{subtotal.toFixed(2)}</span>
              </div>
            </div>
          </Card>

          <Button
            className="w-full"
            size="lg"
            onClick={handleContinueToPayment}
          >
            Continue to Payment
          </Button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-6">
          <Button variant="ghost" onClick={() => setStep(1)}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Order Review
          </Button>

          <Card className="p-6">
            <h2 className="text-2xl font-semibold mb-6">Select Payment Method</h2>

            {/* Payment Method Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 pb-20 lg:pb-6">
              {/* GCash Card */}
              <button
                onClick={() => handlePaymentMethodSelect('gcash')}
                className={`p-6 border-2 rounded-lg transition-all text-left ${
                  paymentMethod === 'gcash'
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                      paymentMethod === 'gcash'
                        ? 'border-blue-600 bg-blue-600'
                        : 'border-gray-300'
                    }`}
                  >
                    {paymentMethod === 'gcash' && (
                      <div className="w-3 h-3 rounded-full bg-white" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Smartphone className="w-6 h-6 text-blue-600" />
                      <span className="font-semibold text-lg">Pay with GCash</span>
                    </div>
                    <p className="text-sm text-gray-600">
                      Pay using your GCash mobile wallet
                    </p>
                  </div>
                </div>
              </button>

              {/* Maya Card */}
              <button
                onClick={() => handlePaymentMethodSelect('maya')}
                className={`p-6 border-2 rounded-lg transition-all text-left ${
                  paymentMethod === 'maya'
                    ? 'border-orange-600 bg-orange-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                      paymentMethod === 'maya'
                        ? 'border-orange-600 bg-orange-600'
                        : 'border-gray-300'
                    }`}
                  >
                    {paymentMethod === 'maya' && (
                      <div className="w-3 h-3 rounded-full bg-white" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <CreditCard className="w-6 h-6 text-orange-600" />
                      <span className="font-semibold text-lg">Pay with Maya</span>
                    </div>
                    <p className="text-sm text-gray-600">
                      Pay using your Maya mobile wallet
                    </p>
                  </div>
                </div>
              </button>
            </div>

            {/* Payment Instructions */}
            {paymentMethod && (
              <div className="border-t pt-6 space-y-4">
                <h3 className="font-semibold">
                  {paymentMethod === 'gcash' ? 'GCash Payment Instructions' : 'Maya Payment Instructions'}
                </h3>
                {paymentMethod === 'gcash' ? (
                  <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
                    <li>Enter your GCash mobile number below</li>
                    <li>You'll receive a push notification in your GCash app</li>
                    <li>Open GCash, enter your PIN/biometric to approve</li>
                    <li>Return here to confirm payment</li>
                  </ol>
                ) : (
                  <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
                    <li>Enter your Maya mobile number below</li>
                    <li>You'll receive an OTP in your Maya app</li>
                    <li>Enter the OTP here to confirm payment</li>
                    <li>Your order will be completed instantly</li>
                  </ol>
                )}

                <div className="space-y-2">
                  <Label htmlFor="mobile-number">Mobile Number</Label>
                  <Input
                    id="mobile-number"
                    type="tel"
                    placeholder="09XX-XXX-XXXX"
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, ''))}
                    maxLength={11}
                  />
                  <p className="text-xs text-gray-500">
                    Enter your {paymentMethod === 'gcash' ? 'GCash' : 'Maya'} registered mobile number
                  </p>
                </div>
              </div>
            )}

            {/* Order Summary Sidebar */}
            <div className="border-t mt-6 pt-6">
              <div className="flex justify-between text-sm mb-2">
                <span>Subtotal</span>
                <span>₱{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xl font-bold pt-2 border-t">
                <span>Total</span>
                <span className="text-purple-600">₱{subtotal.toFixed(2)}</span>
              </div>
            </div>
          </Card>

          <Button
            className="w-full"
            size="lg"
            onClick={handlePayNow}
            disabled={!paymentMethod || !mobileNumber || processing}
            style={{
              backgroundColor: paymentMethod === 'gcash' ? '#0066CC' : paymentMethod === 'maya' ? '#FF6B35' : undefined,
            }}
          >
            {processing ? 'Processing...' : `Pay Now ₱${subtotal.toFixed(2)}`}
          </Button>
        </div>
      )}
    </div>
  )
}
