/**
 * Client-safe template helper functions
 * These functions don't require server-side code and can be used in client components
 */

/**
 * Replace template variables
 * Variables: {{buyer_name}}, {{product_title}}, {{seller_name}}
 */
export function replaceTemplateVariables(
  template: string,
  variables: {
    buyerName?: string
    productTitle?: string
    sellerName?: string
  }
): string {
  let result = template

  if (variables.buyerName) {
    result = result.replace(/\{\{buyer_name\}\}/g, variables.buyerName)
  }

  if (variables.productTitle) {
    result = result.replace(/\{\{product_title\}\}/g, variables.productTitle)
  }

  if (variables.sellerName) {
    result = result.replace(/\{\{seller_name\}\}/g, variables.sellerName)
  }

  return result
}
