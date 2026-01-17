'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  getGuestCart,
  addToGuestCart as addToCart,
  removeFromGuestCart as removeFromCart,
  clearGuestCart as clearCart,
  hasProductInGuestCart as hasProduct,
  getGuestCartCount,
  getGuestCartProductIds,
} from '@/lib/utils/guest-cart'

/**
 * React hook for managing guest cart
 * 
 * Provides reactive cart state and operations for guest users.
 * Syncs with localStorage and handles cross-tab synchronization.
 */
export function useGuestCart() {
  const [cartItems, setCartItems] = useState<string[]>([])
  const [cartCount, setCartCount] = useState(0)

  // Load cart from localStorage on mount
  useEffect(() => {
    const loadCart = () => {
      const productIds = getGuestCartProductIds()
      setCartItems(productIds)
      setCartCount(productIds.length)
    }

    loadCart()

    // Listen for storage changes (cross-tab synchronization)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'akomay_guest_cart') {
        loadCart()
      }
    }

    window.addEventListener('storage', handleStorageChange)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [])

  const addItem = useCallback((productId: string) => {
    if (!productId) return

    const success = addToCart(productId)
    if (success) {
      const productIds = getGuestCartProductIds()
      setCartItems(productIds)
      setCartCount(productIds.length)
      
      // Dispatch custom event for same-tab synchronization
      window.dispatchEvent(new Event('guestCartUpdated'))
    }
  }, [])

  const removeItem = useCallback((productId: string) => {
    if (!productId) return

    const success = removeFromCart(productId)
    if (success) {
      const productIds = getGuestCartProductIds()
      setCartItems(productIds)
      setCartCount(productIds.length)
      
      // Dispatch custom event for same-tab synchronization
      window.dispatchEvent(new Event('guestCartUpdated'))
    }
  }, [])

  const clear = useCallback(() => {
    const success = clearCart()
    if (success) {
      setCartItems([])
      setCartCount(0)
      
      // Dispatch custom event for same-tab synchronization
      window.dispatchEvent(new Event('guestCartUpdated'))
    }
  }, [])

  const hasItem = useCallback((productId: string) => {
    return hasProduct(productId)
  }, [])

  // Listen for same-tab cart updates
  useEffect(() => {
    const handleCartUpdate = () => {
      const productIds = getGuestCartProductIds()
      setCartItems(productIds)
      setCartCount(productIds.length)
    }

    window.addEventListener('guestCartUpdated', handleCartUpdate)

    return () => {
      window.removeEventListener('guestCartUpdated', handleCartUpdate)
    }
  }, [])

  return {
    cartItems,
    cartCount,
    addItem,
    removeItem,
    clearCart: clear,
    hasItem,
  }
}
