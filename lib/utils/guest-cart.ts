/**
 * Guest Cart Utilities
 * 
 * Manages guest cart stored in localStorage.
 * Cart persists across browser sessions until user logs in and merges with database cart.
 */

const GUEST_CART_KEY = 'akomay_guest_cart'

export interface GuestCart {
  productIds: string[]
  timestamp: number
}

/**
 * Get guest cart from localStorage
 */
export function getGuestCart(): GuestCart {
  if (typeof window === 'undefined') {
    return { productIds: [], timestamp: Date.now() }
  }

  try {
    const stored = localStorage.getItem(GUEST_CART_KEY)
    if (!stored) {
      return { productIds: [], timestamp: Date.now() }
    }

    const cart: GuestCart = JSON.parse(stored)
    
    // Validate structure
    if (!Array.isArray(cart.productIds)) {
      return { productIds: [], timestamp: Date.now() }
    }

    // Deduplicate product IDs
    const uniqueIds = Array.from(new Set(cart.productIds.filter(id => typeof id === 'string' && id.length > 0)))
    
    return {
      productIds: uniqueIds,
      timestamp: cart.timestamp || Date.now()
    }
  } catch (error) {
    console.error('Error reading guest cart from localStorage:', error)
    return { productIds: [], timestamp: Date.now() }
  }
}

/**
 * Save guest cart to localStorage
 */
function saveGuestCart(cart: GuestCart): boolean {
  if (typeof window === 'undefined') {
    return false
  }

  try {
    localStorage.setItem(GUEST_CART_KEY, JSON.stringify(cart))
    return true
  } catch (error) {
    // Handle quota exceeded or private browsing mode
    if (error instanceof DOMException && (error.code === 22 || error.code === 1014)) {
      console.warn('localStorage quota exceeded, cannot save guest cart')
    } else {
      console.error('Error saving guest cart to localStorage:', error)
    }
    return false
  }
}

/**
 * Add product to guest cart
 */
export function addToGuestCart(productId: string): boolean {
  if (!productId || typeof productId !== 'string') {
    return false
  }

  const cart = getGuestCart()
  
  // Check if already in cart
  if (cart.productIds.includes(productId)) {
    return true // Already in cart, consider it success
  }

  cart.productIds.push(productId)
  cart.timestamp = Date.now()
  
  return saveGuestCart(cart)
}

/**
 * Remove product from guest cart
 */
export function removeFromGuestCart(productId: string): boolean {
  if (!productId) {
    return false
  }

  const cart = getGuestCart()
  cart.productIds = cart.productIds.filter(id => id !== productId)
  cart.timestamp = Date.now()
  
  return saveGuestCart(cart)
}

/**
 * Clear guest cart
 */
export function clearGuestCart(): boolean {
  if (typeof window === 'undefined') {
    return false
  }

  try {
    localStorage.removeItem(GUEST_CART_KEY)
    return true
  } catch (error) {
    console.error('Error clearing guest cart:', error)
    return false
  }
}

/**
 * Get count of items in guest cart
 */
export function getGuestCartCount(): number {
  const cart = getGuestCart()
  return cart.productIds.length
}

/**
 * Check if product is in guest cart
 */
export function hasProductInGuestCart(productId: string): boolean {
  if (!productId) {
    return false
  }

  const cart = getGuestCart()
  return cart.productIds.includes(productId)
}

/**
 * Get all product IDs in guest cart
 */
export function getGuestCartProductIds(): string[] {
  const cart = getGuestCart()
  return [...cart.productIds] // Return copy to prevent mutation
}
