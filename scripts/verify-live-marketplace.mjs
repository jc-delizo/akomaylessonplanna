const DEFAULT_BASE_URL = 'https://akomaylessonplanna.vercel.app'
const EXPECTED_CATALOG_SIZE = 500
const CATALOG_SLUG_PREFIX = 'starter-catalog-v1-'
const PAGE_SIZE = 100
const requestConcurrency = Math.max(
  1,
  Math.min(4, Number(process.env.VERIFY_REQUEST_CONCURRENCY) || 2)
)

const baseUrlArgument = process.argv.find((argument) => argument.startsWith('--base-url='))
const baseUrl = (
  baseUrlArgument?.slice('--base-url='.length) ||
  process.env.MARKETPLACE_BASE_URL ||
  DEFAULT_BASE_URL
).replace(/\/$/, '')

async function getJson(path) {
  const response = await fetch(`${baseUrl}${path}`, {
    headers: {
      accept: 'application/json',
      'user-agent': 'AkoMay marketplace catalog verifier/1.0',
    },
  })

  if (!response.ok) {
    throw new Error(`${path} returned HTTP ${response.status}.`)
  }

  const contentType = response.headers.get('content-type') || ''
  if (!contentType.includes('application/json')) {
    throw new Error(`${path} did not return JSON (${contentType || 'unknown content type'}).`)
  }

  return response.json()
}

async function getPage(path) {
  const response = await fetch(`${baseUrl}${path}`, {
    headers: { 'user-agent': 'AkoMay marketplace catalog verifier/1.0' },
  })
  if (!response.ok) throw new Error(`${path} returned HTTP ${response.status}.`)
  return response
}

function uniqueBy(values, selector) {
  return [...new Map(values.map((value) => [selector(value), value])).values()]
}

function countValues(products, selector) {
  const counts = new Map()
  for (const product of products) {
    const selected = selector(product)
    for (const value of Array.isArray(selected) ? selected : [selected]) {
      if (value == null) continue
      const key = String(value)
      counts.set(key, (counts.get(key) || 0) + 1)
    }
  }
  return counts
}

function verifyCoverage(summaries, products, group, options, selector) {
  const counts = countValues(products, selector)
  const missing = options.filter((option) => !counts.get(String(option.value)))
  if (missing.length) {
    throw new Error(`${group} coverage is missing: ${missing.map((option) => option.label).join(', ')}`)
  }
  summaries.push({
    group,
    totals: options.map((option) => counts.get(String(option.value)) || 0),
  })
}

function addCheck(checks, group, label, params) {
  if (label == null || Object.values(params).some((value) => value == null)) return
  checks.push({ group, label, params })
}

async function runLimited(items, operation) {
  const results = new Array(items.length)
  let cursor = 0

  async function worker() {
    while (cursor < items.length) {
      const index = cursor
      cursor += 1
      results[index] = await operation(items[index], index)
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(requestConcurrency, Math.max(1, items.length)) }, () => worker())
  )
  return results
}

async function runFilterChecks(checks) {
  return runLimited(checks, async (check) => {
    const query = new URLSearchParams({ limit: '1', ...check.params })
    const data = await getJson(`/api/search?${query}`)
    const total = Number(data.pagination?.total || 0)
    if (total < 1 || !Array.isArray(data.products) || data.products.length < 1) {
      throw new Error(`${check.group} check “${check.label}” returned no products.`)
    }
    return { ...check, total }
  })
}

function printCoverage(summaries) {
  for (const summary of summaries) {
    const minimum = Math.min(...summary.totals)
    const maximum = Math.max(...summary.totals)
    const range = minimum === maximum ? String(minimum) : `${minimum}–${maximum}`
    console.log(`  ${summary.group}: ${summary.totals.length} options covered (${range} resources per option)`)
  }
}

function printFilterChecks(results) {
  const groups = new Map()
  for (const result of results) {
    groups.set(result.group, (groups.get(result.group) || 0) + 1)
  }
  console.log(`  Representative public API checks: ${results.length} passed`)
  console.log(`  API groups exercised: ${[...groups.keys()].join(', ')}`)
}

async function main() {
  console.log(`Verifying marketplace at ${baseUrl}`)
  const [config, firstPage] = await Promise.all([
    getJson('/api/lesson-plan-config'),
    getJson(`/api/search?limit=${PAGE_SIZE}&sort=newest`),
  ])

  const total = Number(firstPage.pagination?.total || 0)
  if (total < EXPECTED_CATALOG_SIZE) {
    throw new Error(`Expected at least ${EXPECTED_CATALOG_SIZE} published products, found ${total}.`)
  }

  const totalPages = Number(firstPage.pagination?.totalPages || 1)
  const remainingPages = Array.from({ length: Math.max(0, totalPages - 1) }, (_, index) => index + 2)
  const pageResults = await runLimited(remainingPages, (page) =>
    getJson(`/api/search?limit=${PAGE_SIZE}&sort=newest&page=${page}`)
  )
  const allProducts = [firstPage, ...pageResults].flatMap((result) => result.products || [])
  const seededProducts = allProducts.filter((product) => product.slug?.startsWith(CATALOG_SLUG_PREFIX))

  if (seededProducts.length !== EXPECTED_CATALOG_SIZE) {
    throw new Error(`Expected exactly ${EXPECTED_CATALOG_SIZE} starter-catalog products, found ${seededProducts.length}.`)
  }

  const subjects = uniqueBy(
    [
      ...Object.values(config.regular?.subjectsByGrade || {}).flat(),
      ...Object.values(config.regular?.subjectsByStrand || {}).flat(),
    ],
    (subject) => subject.id
  )
  const documentTypes = Object.values(config.specificTypesByProductType || {}).flat()
  const weekOptions = Array.from({ length: 9 }, (_, index) => ({
    value: index + 1,
    label: `Week ${index + 1}`,
  }))
  const summaries = []

  verifyCoverage(
    summaries,
    seededProducts,
    'Product types',
    (config.productTypes || []).map((option) => ({ value: option.slug, label: option.label })),
    (product) => product.product_type
  )
  verifyCoverage(summaries, seededProducts, 'Document types', documentTypes, (product) => product.specific_type)
  verifyCoverage(summaries, seededProducts, 'Curricula', config.curricula || [], (product) => product.curriculum)
  verifyCoverage(
    summaries,
    seededProducts,
    'Grade levels',
    (config.regular?.grades || []).map((option) => ({ value: option.id, label: option.name })),
    (product) => product.grade_id
  )
  verifyCoverage(
    summaries,
    seededProducts,
    'SHS strands',
    (config.regular?.strands || []).map((option) => ({ value: option.id, label: option.name })),
    (product) => product.strand_id
  )
  verifyCoverage(
    summaries,
    seededProducts,
    'Subjects',
    subjects.map((option) => ({ value: option.id, label: option.name })),
    (product) => product.subject_ids
  )
  verifyCoverage(summaries, seededProducts, 'Quarters', config.quarters || [], (product) => product.quarter)
  verifyCoverage(summaries, seededProducts, 'Languages', config.languages || [], (product) => product.language)
  verifyCoverage(summaries, seededProducts, 'Modalities', config.modalities || [], (product) => product.modalities)
  verifyCoverage(summaries, seededProducts, 'Teaching frameworks', config.teachingFrameworks || [], (product) => product.teaching_framework)
  verifyCoverage(summaries, seededProducts, 'Weeks', weekOptions, (product) => product.weeks)

  const productsWithFiles = seededProducts.filter((product) => product.file_urls?.length).length
  const productsWithCovers = seededProducts.filter((product) => product.cover_image_url).length
  const verifiedSellerProducts = seededProducts.filter((product) => product.seller?.is_verified_teacher).length
  if (
    productsWithFiles !== EXPECTED_CATALOG_SIZE ||
    productsWithCovers !== EXPECTED_CATALOG_SIZE ||
    verifiedSellerProducts !== EXPECTED_CATALOG_SIZE
  ) {
    throw new Error(
      `Catalog completeness failed: files=${productsWithFiles}, covers=${productsWithCovers}, verified seller=${verifiedSellerProducts}.`
    )
  }

  const newest = seededProducts.slice(0, 12)
  const newestTypeCount = new Set(newest.map((product) => product.product_type)).size
  const newestLanguageCount = new Set(newest.map((product) => product.language)).size
  if (newestTypeCount < 5 || newestLanguageCount < 8) {
    throw new Error(
      `Newest feed is insufficiently varied: ${newestTypeCount} product types and ${newestLanguageCount} languages in the first 12 resources.`
    )
  }

  const checks = []
  const last = (values) => values?.at(-1)
  const firstDocumentGroup = Object.entries(config.specificTypesByProductType || {})[0]
  addCheck(checks, 'Product type', last(config.productTypes)?.label, {
    product_type: last(config.productTypes)?.slug,
  })
  addCheck(checks, 'Document type', firstDocumentGroup?.[1]?.[0]?.label, {
    product_type: firstDocumentGroup?.[0],
    specific_type: firstDocumentGroup?.[1]?.[0]?.value,
  })
  addCheck(checks, 'Curriculum', last(config.curricula)?.label, { curriculum: last(config.curricula)?.value })
  addCheck(checks, 'Grade', last(config.regular?.grades)?.name, { grade_id: last(config.regular?.grades)?.id })
  addCheck(checks, 'Strand', last(config.regular?.strands)?.name, { strand_id: last(config.regular?.strands)?.id })
  addCheck(checks, 'Subject', last(subjects)?.name, { subject_id: last(subjects)?.id })
  addCheck(checks, 'Quarter', last(config.quarters)?.label, { quarter: last(config.quarters)?.value })
  addCheck(checks, 'Language', last(config.languages)?.label, { language: last(config.languages)?.value })
  addCheck(checks, 'Modality', last(config.modalities)?.label, { modalities: last(config.modalities)?.value })
  addCheck(checks, 'Week', 'Week 9', { weeks: '9' })
  for (const sort of ['relevance', 'newest', 'best_selling', 'highest_rated', 'price_asc', 'price_desc']) {
    addCheck(checks, 'Sort', sort, { sort })
  }
  addCheck(checks, 'Verified seller', 'Verified seller', { verified_seller_only: 'true' })
  addCheck(checks, 'Class type', 'Regular class', { class_type: 'regular' })
  addCheck(checks, 'Date added', 'Last 7 days', { date_added: 'last_7_days' })
  addCheck(checks, 'Price', 'Lowest price', { max_price: '50' })
  addCheck(checks, 'Search', 'Mathematics', { q: 'Mathematics' })

  const filterResults = await runFilterChecks(checks)
  const sample = seededProducts[0]
  const [productPage, sellerPage, cover] = await Promise.all([
    getPage(`/products/${sample.id}`),
    getPage('/sellers/akomay_resource_team'),
    fetch(sample.cover_image_url),
  ])
  const coverType = cover.headers.get('content-type') || ''
  if (!cover.ok || !coverType.includes('image/webp')) {
    throw new Error(`Sample cover check failed (HTTP ${cover.status}, ${coverType || 'unknown type'}).`)
  }

  console.log(`\nPublished marketplace: ${total} products (${seededProducts.length} in starter catalog)`)
  printCoverage(summaries)
  console.log(`  Newest-feed variety: ${newestTypeCount} product types and ${newestLanguageCount} languages in the first 12`)
  printFilterChecks(filterResults)
  console.log(`  Pages and media: product ${productPage.status}, seller ${sellerPage.status}, WebP cover ${cover.status}`)
  console.log('\nLive marketplace verification passed.')
}

main().catch((error) => {
  console.error(`\nLive verification failed: ${error instanceof Error ? error.message : String(error)}`)
  process.exitCode = 1
})
