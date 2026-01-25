'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardContent, CardFooter, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import Link from 'next/link'
import { ArrowLeft, Check, FileText } from 'lucide-react'
import { getFullName } from '@/lib/utils/profile'

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
      first_name: string
      last_name: string
      name?: string // For backward compatibility
      username: string
    }
  }
}

export function CheckoutContent() {
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

  // Progress Stepper Component
  const ProgressStepper = () => (
    <Card className="mb-6">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          {/* Step 1 */}
          <div className="flex flex-col items-center flex-1">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition-all mb-2 ${
                step >= 1
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-200 text-gray-600'
              }`}
            >
              {step > 1 ? (
                <Check className="w-5 h-5" />
              ) : (
                '1'
              )}
            </div>
            <p className={`text-sm font-medium text-center ${step >= 1 ? 'text-gray-900' : 'text-gray-500'}`}>
              Review Order
            </p>
          </div>

          {/* Progress Line */}
          <div className="flex-1 h-1 mx-4 mt-5 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 rounded-full ${
                step >= 2 ? 'bg-purple-600' : 'bg-gray-200'
              }`}
              style={{ width: step >= 2 ? '100%' : '0%' }}
            />
          </div>

          {/* Step 2 */}
          <div className="flex flex-col items-center flex-1">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition-all mb-2 ${
                step >= 2
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-200 text-gray-600'
              }`}
            >
              2
            </div>
            <p className={`text-sm font-medium text-center ${step >= 2 ? 'text-gray-900' : 'text-gray-500'}`}>
              Payment Method
            </p>
          </div>
        </div>

        <div className="mt-4 text-center">
          <Badge variant="outline" className="text-xs">
            Step {step} of 2
          </Badge>
        </div>
      </CardContent>
    </Card>
  )

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <Card className="mb-6">
          <CardContent className="pt-6">
            <Skeleton className="h-16 w-full" />
          </CardContent>
        </Card>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
                <Separator />
                <Skeleton className="h-8 w-full" />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  if (cartItems.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card>
          <CardContent className="pt-12 pb-12 text-center">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <CardTitle className="text-2xl mb-2">No items to checkout</CardTitle>
            <p className="text-gray-600 mb-6">
              Your cart is empty or the selected items are no longer available.
            </p>
            <Button asChild>
              <Link href="/cart">Go to Cart</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-6 lg:py-8 max-w-6xl">
      {/* Mobile: Sticky Pay Button */}
      {step === 2 && paymentMethod && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t p-4 z-50 shadow-lg backdrop-blur-sm">
          <Button
            className="w-full"
            size="lg"
            onClick={handlePayNow}
            disabled={!paymentMethod || !mobileNumber || processing}
            style={{
              backgroundColor: paymentMethod === 'gcash' ? '#0066CC' : paymentMethod === 'maya' ? '#10b981' : undefined,
            }}
          >
            {processing ? 'Processing...' : `Pay Now ₱${subtotal.toFixed(2)}`}
          </Button>
        </div>
      )}

      {/* Progress Stepper */}
      <ProgressStepper />

      {step === 1 && (
        <div className="space-y-6">
          <Button variant="ghost" asChild>
            <Link href="/cart">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Cart
            </Link>
          </Button>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Main Content */}
            <div>
              <Card>
              <CardHeader>
                <CardTitle className="text-2xl">Review Your Order</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {cartItems.map((item, index) => (
                  <div key={item.id}>
                    <div className="flex gap-4">
                      <div className="w-24 h-24 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 border">
                        {item.product.cover_image_url ? (
                          <img
                            src={item.product.cover_image_url}
                            alt={item.product.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <FileText className="w-8 h-8" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <Link
                          href={`/products/${item.product.id}`}
                          className="font-semibold text-base hover:text-purple-600 transition-colors line-clamp-2"
                        >
                          {item.product.title}
                        </Link>
                        <p className="text-sm text-gray-600 mt-1">
                          by {getFullName(item.product.seller)}
                        </p>
                        <p className="text-lg font-bold text-purple-600 mt-2">
                          ₱{item.product.price.toFixed(2)}
                        </p>
                      </div>
                    </div>
                    {index < cartItems.length - 1 && <Separator className="mt-4" />}
                  </div>
                ))}
              </CardContent>
              </Card>
            </div>

            {/* Order Summary */}
            <div>
              <Card>
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">
                      Subtotal <Badge variant="outline" className="ml-2">{cartItems.length} {cartItems.length === 1 ? 'item' : 'items'}</Badge>
                    </span>
                    <span className="font-medium">₱{subtotal.toFixed(2)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold">Total</span>
                    <span className="text-2xl font-bold text-purple-600">₱{subtotal.toFixed(2)}</span>
                  </div>
                </CardContent>
                <CardFooter className="flex-col gap-3 pt-0">
                  <Button
                    className="w-full"
                    size="lg"
                    onClick={handleContinueToPayment}
                  >
                    Continue to Payment
                  </Button>
                  <Button variant="outline" className="w-full" asChild>
                    <Link href="/cart">Back to Cart</Link>
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-6">
          <Button variant="ghost" onClick={() => setStep(1)}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Order Review
          </Button>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Main Content */}
            <div className="space-y-6">
              <Card>
              <CardHeader>
                <CardTitle className="text-2xl">Select Payment Method</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Payment Method Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* GCash Card */}
                  <Card
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      paymentMethod === 'gcash'
                        ? 'ring-2 ring-blue-600 bg-blue-50/50'
                        : 'hover:border-blue-300'
                    }`}
                    onClick={() => handlePaymentMethodSelect('gcash')}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div
                          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-1 transition-all ${
                            paymentMethod === 'gcash'
                              ? 'border-blue-600 bg-blue-600'
                              : 'border-gray-300'
                          }`}
                        >
                          {paymentMethod === 'gcash' && (
                            <Check className="w-4 h-4 text-white" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <img 
                              src="/gcashcheckout.png" 
                              alt="GCash" 
                              className="h-8 w-auto object-contain"
                            />
                            <span className="font-semibold text-lg">Pay with GCash</span>
                            {paymentMethod === 'gcash' && (
                              <Badge variant="default" className="ml-2">Selected</Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-600">
                            Pay using your GCash mobile wallet
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Maya Card */}
                  <Card
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      paymentMethod === 'maya'
                        ? 'ring-2 ring-emerald-600 bg-emerald-50/50'
                        : 'hover:border-emerald-300'
                    }`}
                    onClick={() => handlePaymentMethodSelect('maya')}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div
                          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-1 transition-all ${
                            paymentMethod === 'maya'
                              ? 'border-emerald-600 bg-emerald-600'
                              : 'border-gray-300'
                          }`}
                        >
                          {paymentMethod === 'maya' && (
                            <Check className="w-4 h-4 text-white" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <img 
                              src="/mayacheckout.png" 
                              alt="Maya" 
                              className="h-8 w-auto object-contain"
                            />
                            <span className="font-semibold text-lg">Pay with Maya</span>
                            {paymentMethod === 'maya' && (
                              <Badge variant="default" className="ml-2">Selected</Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-600">
                            Pay using your Maya mobile wallet
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Payment Instructions */}
                {paymentMethod && (
                  <>
                    <Separator />
                    <div className="space-y-4">
                      <div>
                        <h3 className="font-semibold text-lg mb-3">
                          {paymentMethod === 'gcash' ? 'GCash Payment Instructions' : 'Maya Payment Instructions'}
                        </h3>
                        <Card className="bg-gray-50">
                          <CardContent className="pt-4">
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
                          </CardContent>
                        </Card>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="mobile-number">Mobile Number</Label>
                        <Input
                          id="mobile-number"
                          type="tel"
                          placeholder="09XX-XXX-XXXX"
                          value={mobileNumber}
                          onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, ''))}
                          maxLength={11}
                          className="text-base"
                        />
                        <p className="text-xs text-gray-500">
                          Enter your {paymentMethod === 'gcash' ? 'GCash' : 'Maya'} registered mobile number
                        </p>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

              {/* Desktop Pay Button */}
              <div className="hidden lg:block">
                <Button
                  className="w-full"
                  size="lg"
                  onClick={handlePayNow}
                  disabled={!paymentMethod || !mobileNumber || processing}
                  style={{
                    backgroundColor: paymentMethod === 'gcash' ? '#0066CC' : paymentMethod === 'maya' ? '#10b981' : undefined,
                  }}
                >
                  {processing ? 'Processing...' : `Pay Now ₱${subtotal.toFixed(2)}`}
                </Button>
              </div>
            </div>

            {/* Order Summary */}
            <div>
              <Card>
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    {cartItems.map((item) => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span className="text-gray-600 line-clamp-1 flex-1 mr-2">
                          {item.product.title}
                        </span>
                        <span className="font-medium flex-shrink-0">₱{item.product.price.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                  <Separator />
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">
                      Subtotal <Badge variant="outline" className="ml-2">{cartItems.length} {cartItems.length === 1 ? 'item' : 'items'}</Badge>
                    </span>
                    <span className="font-medium">₱{subtotal.toFixed(2)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold">Total</span>
                    <span className="text-2xl font-bold text-purple-600">₱{subtotal.toFixed(2)}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
