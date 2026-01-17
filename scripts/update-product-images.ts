import { config } from 'dotenv'
import { resolve } from 'path'
import { createAdminClient } from '../lib/supabase/admin'

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') })

function generateImageUrl(keywords: string[], width = 1200, height = 800): string {
  // Use picsum.photos (Lorem Picsum) - a reliable placeholder image service
  const seed = keywords.join('').split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  return `https://picsum.photos/seed/${seed}/${width}/${height}`
}

function generatePreviewImages(keywords: string[]): string[] {
  const baseSeed = keywords.join('').split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  return [
    `https://picsum.photos/seed/${baseSeed + 1}/1200/800`,
    `https://picsum.photos/seed/${baseSeed + 2}/1200/800`,
    `https://picsum.photos/seed/${baseSeed + 3}/1200/800`
  ]
}

function getKeywordsForProduct(product: any): string[] {
  const productType = product.product_type?.toLowerCase() || ''
  const specificType = product.specific_type?.toLowerCase() || ''
  const theme = product.theme?.toLowerCase() || ''
  
  if (productType === 'exams') {
    return ['education', 'exam', 'test', 'assessment']
  } else if (productType === 'lesson plans') {
    return ['lesson', 'plan', 'education', 'teaching']
  } else if (productType === 'rpms') {
    return ['portfolio', 'cover', theme || 'professional', 'document']
  } else if (productType === 'posters') {
    return ['poster', 'education', theme || 'classroom', 'visual']
  } else if (productType === 'tarpaulins') {
    return ['tarpaulin', 'banner', product.season?.toLowerCase() || product.occasion?.toLowerCase() || 'event']
  }
  
  return ['education', 'teaching', 'learning']
}

async function main() {
  console.log('🔄 Updating product images to use picsum.photos...\n')

  const supabase = createAdminClient()

  try {
    // Fetch all products with old Unsplash URLs
    const { data: products, error: fetchError } = await supabase
      .from('products')
      .select('id, title, product_type, specific_type, theme, season, occasion, cover_image_url, preview_images')
      .or('cover_image_url.ilike.%source.unsplash.com%,preview_images.cs.{https://source.unsplash.com%}')

    if (fetchError) {
      throw new Error(`Failed to fetch products: ${fetchError.message}`)
    }

    if (!products || products.length === 0) {
      console.log('✓ No products with Unsplash URLs found. All products are up to date.')
      return
    }

    console.log(`Found ${products.length} products to update.\n`)

    let successCount = 0
    let failCount = 0

    for (const product of products) {
      try {
        const keywords = getKeywordsForProduct(product)
        const newCoverImage = generateImageUrl(keywords)
        const newPreviewImages = generatePreviewImages(keywords)

        const { error: updateError } = await supabase
          .from('products')
          .update({
            cover_image_url: newCoverImage,
            preview_images: newPreviewImages
          })
          .eq('id', product.id)

        if (updateError) {
          console.error(`  ❌ Failed to update product "${product.title}": ${updateError.message}`)
          failCount++
        } else {
          console.log(`  ✓ Updated: ${product.title}`)
          successCount++
        }
      } catch (error) {
        console.error(`  ❌ Error updating product: ${error instanceof Error ? error.message : 'Unknown error'}`)
        failCount++
      }
    }

    console.log(`\n✅ Update complete: ${successCount} successful, ${failCount} failed`)
  } catch (error) {
    console.error('\n❌ Script failed:', error instanceof Error ? error.message : 'Unknown error')
    process.exit(1)
  }
}

main()
  .then(() => {
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Unhandled error:', error)
    process.exit(1)
  })
