import { createHash, randomBytes } from 'node:crypto'
import { createClient } from '@supabase/supabase-js'
import sharp from 'sharp'

const CATALOG_VERSION = 'v1'
const PRODUCT_COUNT = 500
const SLUG_PREFIX = `starter-catalog-${CATALOG_VERSION}`
const STORAGE_PREFIX = `catalog-${CATALOG_VERSION}`
const SELLER_EMAIL = 'catalog@seed.akomaylessonplanna.test'
const SELLER_USERNAME = 'akomay_resource_team'
const APPLY = process.argv.includes('--apply')
const VERIFY_ONLY = process.argv.includes('--verify-only')
const uploadConcurrency = Math.max(1, Math.min(20, Number(process.env.SEED_UPLOAD_CONCURRENCY) || 10))

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseSecret = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseSecret) {
  throw new Error(
    'Set SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) and SUPABASE_SECRET_KEY (or SUPABASE_SERVICE_ROLE_KEY).'
  )
}

const supabase = createClient(supabaseUrl, supabaseSecret, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const TYPE_STYLES = {
  exams: { accent: '#2563eb', pale: '#dbeafe', label: 'ASSESSMENT' },
  lesson_plans: { accent: '#ea580c', pale: '#ffedd5', label: 'LESSON PLAN' },
  rpms: { accent: '#7c3aed', pale: '#ede9fe', label: 'RPMS TOOL' },
  posters: { accent: '#059669', pale: '#d1fae5', label: 'CLASSROOM POSTER' },
  tarpaulins: { accent: '#db2777', pale: '#fce7f3', label: 'EVENT DESIGN' },
}

const GENERIC_FOCUS = [
  'Core Concepts',
  'Guided Practice',
  'Real-World Connections',
  'Collaborative Learning',
  'Performance Task',
  'Review and Enrichment',
]

const FOCUS_BY_GROUP = {
  mathematics: [
    'Patterns and Problem Solving',
    'Number Sense in Daily Life',
    'Reasoning and Representation',
    'Measurement and Data',
    'Functions and Relationships',
    'Applied Mathematical Thinking',
  ],
  science: [
    'Observation and Evidence',
    'Systems in the Natural World',
    'Scientific Investigation',
    'Matter, Energy, and Change',
    'Models and Explanations',
    'Science in Everyday Life',
  ],
  communication: [
    'Reading for Meaning',
    'Clear and Purposeful Writing',
    'Speaking and Listening',
    'Vocabulary in Context',
    'Text Analysis and Response',
    'Communication for Real Audiences',
  ],
  society: [
    'Community and Citizenship',
    'Sources and Perspectives',
    'Culture and Identity',
    'People, Places, and Change',
    'Evidence-Based Discussion',
    'Philippine Society in Context',
  ],
  values: [
    'Respect and Responsibility',
    'Thoughtful Decision-Making',
    'Empathy in Action',
    'Community Participation',
    'Reflection and Growth',
    'Everyday Ethical Choices',
  ],
  arts_health: [
    'Creative Expression',
    'Movement and Well-Being',
    'Healthy Daily Choices',
    'Arts in the Community',
    'Active Participation',
    'Personal Wellness Plan',
  ],
  technology: [
    'Digital Skills for Everyday Tasks',
    'Safe and Responsible Technology Use',
    'Design, Build, and Improve',
    'Practical Workplace Skills',
    'Information and Productivity Tools',
    'Technology-Based Problem Solving',
  ],
  business: [
    'Entrepreneurial Thinking',
    'Business Decisions with Evidence',
    'Financial Literacy in Practice',
    'Customer and Market Insights',
    'Planning and Operations',
    'Workplace Readiness',
  ],
}

const GROUP_CODES = {
  mathematics: new Set(['MATH', 'GENMATH', 'PRECALC', 'BASICALC', 'BUSMATH']),
  science: new Set(['SCI', 'GENSCI', 'GENBIO', 'GENCHEM', 'GENPHYS', 'DRRR']),
  communication: new Set(['ENG', 'FIL', 'LANG_MT', 'READLIT', 'EFFCOMM', 'MABISANGKOM', 'LIT', 'MIL']),
  society: new Set(['AP', 'HIST', 'KASAYSAYAN', 'UCSP', 'CPAR', 'MAKABANSA']),
  values: new Set(['GMRC', 'ESP', 'PERDEV', 'LIFECAREER']),
  arts_health: new Set(['MAPEH', 'PE', 'HEALTH']),
  technology: new Set(['TLE', 'COMP', 'EMPTECH']),
  business: new Set(['ENTREP', 'ORG', 'FABM', 'APPECON', 'BUSFIN', 'POM', 'WORKIMM']),
}

const THEMES = ['Clean Lines', 'Warm Classroom', 'Bright Blocks', 'Nature Notes', 'Modern Grid', 'Paper and Ink']
const SIZES = ['A4', 'US Letter', 'A3', '8 x 10 inches', '11 x 14 inches']
const OCCASIONS = ['Recognition Day', 'Moving-Up Ceremony', 'Family Day', 'School Fair', 'Learning Showcase']
const SEASONS = ['Opening of Classes', 'Midyear', 'Year-End', 'Enrollment', 'School Celebration']

function must(result, label) {
  if (result.error) throw new Error(`${label}: ${result.error.message}`)
  return result.data || []
}

function deterministicUuid(seed) {
  const bytes = createHash('sha256').update(seed).digest().subarray(0, 16)
  bytes[6] = (bytes[6] & 0x0f) | 0x50
  bytes[8] = (bytes[8] & 0x3f) | 0x80
  const hex = bytes.toString('hex')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}

function slugify(value) {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function uniqueById(values) {
  return [...new Map(values.map((value) => [value.id, value])).values()]
}

function chunk(values, size) {
  const chunks = []
  for (let index = 0; index < values.length; index += size) {
    chunks.push(values.slice(index, index + size))
  }
  return chunks
}

function sleep(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds))
}

function focusAreasFor(code) {
  for (const [group, codes] of Object.entries(GROUP_CODES)) {
    if (codes.has(code)) return FOCUS_BY_GROUP[group]
  }
  return GENERIC_FOCUS
}

function xmlEscape(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;')
}

function wrapWords(value, maxCharacters, maxLines = Infinity) {
  const words = String(value).trim().split(/\s+/)
  const lines = []
  let current = ''

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word
    if (candidate.length <= maxCharacters || !current) {
      current = candidate
      continue
    }
    lines.push(current)
    current = word
  }
  if (current) lines.push(current)

  if (lines.length <= maxLines) return lines
  const visible = lines.slice(0, maxLines)
  visible[maxLines - 1] = `${visible[maxLines - 1].slice(0, Math.max(1, maxCharacters - 3))}...`
  return visible
}

function pdfSafe(value) {
  return String(value)
    .normalize('NFKD')
    .replace(/[^\x20-\x7e]/g, '-')
    .replaceAll('\\', '\\\\')
    .replaceAll('(', '\\(')
    .replaceAll(')', '\\)')
}

function createPdf(blocks) {
  const printableLines = []
  for (const block of blocks) {
    if (!block.text) {
      printableLines.push({ text: '', size: 10, bold: false, leading: 12 })
      continue
    }
    const size = block.size || 10
    const maxCharacters = size >= 17 ? 48 : size >= 13 ? 66 : 92
    const lines = wrapWords(block.text, maxCharacters)
    for (const line of lines) {
      printableLines.push({
        text: line,
        size,
        bold: Boolean(block.bold),
        leading: block.leading || (size >= 17 ? 23 : size >= 13 ? 18 : 14),
      })
    }
  }

  const pages = []
  let page = []
  let y = 744
  for (const line of printableLines) {
    if (y - line.leading < 54 && page.length > 0) {
      pages.push(page)
      page = []
      y = 744
    }
    page.push({ ...line, y })
    y -= line.leading
  }
  if (page.length) pages.push(page)

  const pageReferences = pages.map((_, index) => `${5 + index * 2} 0 R`).join(' ')
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    `<< /Type /Pages /Kids [${pageReferences}] /Count ${pages.length} >>`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>',
  ]

  pages.forEach((lines, index) => {
    const contentObjectNumber = 6 + index * 2
    const commands = [
      'q 0.99 0.98 0.96 rg 0 0 612 792 re f Q',
      'q 0.92 0.30 0.08 rg 0 770 612 22 re f Q',
      'BT',
    ]
    for (const line of lines) {
      commands.push(`/${line.bold ? 'F2' : 'F1'} ${line.size} Tf`)
      commands.push(line.bold ? '0.08 0.10 0.16 rg' : '0.25 0.29 0.36 rg')
      commands.push(`1 0 0 1 54 ${line.y} Tm (${pdfSafe(line.text)}) Tj`)
    }
    commands.push('ET')
    const stream = `${commands.join('\n')}\n`
    objects.push(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${contentObjectNumber} 0 R >>`
    )
    objects.push(`<< /Length ${Buffer.byteLength(stream)} >>\nstream\n${stream}endstream`)
  })

  let output = '%PDF-1.4\n'
  const offsets = [0]
  objects.forEach((object, index) => {
    offsets[index + 1] = Buffer.byteLength(output)
    output += `${index + 1} 0 obj\n${object}\nendobj\n`
  })
  const xrefOffset = Buffer.byteLength(output)
  output += `xref\n0 ${objects.length + 1}\n`
  output += '0000000000 65535 f \n'
  for (let index = 1; index <= objects.length; index += 1) {
    output += `${String(offsets[index]).padStart(10, '0')} 00000 n \n`
  }
  output += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`
  return Buffer.from(output)
}

function resourceBlocks(product) {
  const meta = product.meta
  const common = [
    { text: 'AKO MAY LESSON PLAN NA! - STARTER CATALOG', size: 9, bold: true },
    { text: product.row.title, size: 18, bold: true, leading: 24 },
    { text: '' },
    { text: 'RESOURCE PROFILE', size: 13, bold: true },
    { text: `Grade: ${meta.grade.name}` },
    { text: `Subject: ${meta.subject.name}` },
    ...(meta.strand ? [{ text: `Senior High School strand: ${meta.strand.name}` }] : []),
    { text: `Curriculum: ${meta.curriculum.label}` },
    { text: `Quarter ${meta.quarter.value}; week focus: ${meta.weeks.join(', ')}` },
    { text: `Language of instruction: ${meta.language.label}` },
    { text: `Delivery modality: ${meta.modalities.map((item) => item.label).join(', ')}` },
    { text: `Teaching framework: ${meta.framework.label}` },
    { text: '' },
    { text: 'PURPOSE', size: 13, bold: true },
    {
      text: `This platform-curated starter resource helps a teacher introduce, practice, or assess ${meta.topic.toLowerCase()} in ${meta.subject.name}. Review the material and adapt examples, timing, and language to the needs of your learners.`,
    },
    { text: '' },
  ]

  if (meta.type.slug === 'lesson_plans') {
    return [
      ...common,
      { text: 'LEARNING TARGETS', size: 13, bold: true },
      { text: `1. Explain the central ideas connected to ${meta.topic.toLowerCase()}.` },
      { text: '2. Apply the ideas through a guided, grade-appropriate task.' },
      { text: '3. Share evidence of understanding through a short formative check.' },
      { text: '' },
      { text: 'SUGGESTED CLASS FLOW (45-60 MINUTES)', size: 13, bold: true },
      { text: '1. Connect (5 minutes): Activate prior knowledge with one familiar example or image.' },
      { text: '2. Clarify (10 minutes): Model the key idea and invite learners to notice important details.' },
      { text: '3. Practice (15 minutes): Guide pairs or small groups through one scaffolded task.' },
      { text: '4. Apply (15 minutes): Let learners solve, create, explain, or demonstrate independently.' },
      { text: '5. Check (5 minutes): Use a one-minute response, exit ticket, or quick conference.' },
      { text: '' },
      { text: 'FORMATIVE ASSESSMENT', size: 13, bold: true },
      { text: `Prompt: What is one important idea you learned about ${meta.topic.toLowerCase()}, and how can you use it in a new situation?` },
      { text: 'Success indicators: accurate idea, relevant example, and clear explanation.' },
      { text: '' },
      { text: 'TEACHER ADAPTATION NOTES', size: 13, bold: true },
      { text: 'Use visual cues, translated directions, manipulatives, or additional response time when helpful. Replace generic examples with local, familiar contexts.' },
    ]
  }

  if (meta.type.slug === 'exams') {
    return [
      ...common,
      { text: 'ASSESSMENT BLUEPRINT', size: 13, bold: true },
      { text: 'Remember and understand: 30%; apply: 40%; analyze and explain: 30%.' },
      { text: '' },
      { text: 'CONSTRUCTED-RESPONSE ITEMS', size: 13, bold: true },
      { text: `1. In your own words, explain a key idea related to ${meta.topic.toLowerCase()}.` },
      { text: '2. Give one accurate example and explain why it fits.' },
      { text: '3. Compare two approaches, cases, or perspectives discussed in class.' },
      { text: '4. Apply the concept to a realistic school, home, or community situation.' },
      { text: '5. Identify one common misconception and correct it using evidence.' },
      { text: '6. Create a diagram, model, outline, or sequence that shows your thinking.' },
      { text: '7. Reflect: Which part was most challenging, and what strategy helped you?' },
      { text: '' },
      { text: 'SCORING GUIDE', size: 13, bold: true },
      { text: '4 - Accurate, complete, well-supported, and clearly communicated.' },
      { text: '3 - Mostly accurate with enough supporting detail.' },
      { text: '2 - Partly accurate; needs clearer reasoning or evidence.' },
      { text: '1 - Beginning response; major ideas need reteaching.' },
    ]
  }

  if (meta.type.slug === 'rpms') {
    return [
      ...common,
      { text: 'EVIDENCE ORGANIZER', size: 13, bold: true },
      { text: 'Objective or indicator: ______________________________________________' },
      { text: 'Artifact or classroom evidence: ______________________________________' },
      { text: 'Date and learning context: ___________________________________________' },
      { text: 'What the evidence demonstrates: _____________________________________' },
      { text: 'Learner impact or result: ____________________________________________' },
      { text: 'Next professional action: ____________________________________________' },
      { text: '' },
      { text: 'QUALITY CHECK', size: 13, bold: true },
      { text: '- The evidence is directly connected to the selected objective.' },
      { text: '- Learner privacy and school data are protected.' },
      { text: '- The annotation explains impact, not only the activity completed.' },
      { text: '- Dates, labels, and supporting files are clear and consistent.' },
      { text: '- Reflection identifies a practical next step.' },
    ]
  }

  if (meta.type.slug === 'posters') {
    return [
      ...common,
      { text: 'POSTER CONTENT PLAN', size: 13, bold: true },
      { text: `Main heading: ${meta.topic}` },
      { text: 'Key idea 1: Use one short, memorable statement.' },
      { text: 'Key idea 2: Pair the statement with a concrete example or visual.' },
      { text: 'Key idea 3: Add one question that encourages learner thinking.' },
      { text: '' },
      { text: 'CLASSROOM USE', size: 13, bold: true },
      { text: 'Introduce the poster in a brief class conversation before displaying it. Invite learners to add examples on sticky notes or in a class notebook.' },
      { text: '' },
      { text: 'PRINT CHECK', size: 13, bold: true },
      { text: `Recommended output size: ${meta.size}. Check contrast, margins, and readability from the back of the room before final printing.` },
    ]
  }

  return [
    ...common,
    { text: 'EVENT BANNER CONTENT', size: 13, bold: true },
    { text: `Event: ${meta.occasion}` },
    { text: 'School or organization: ______________________________________________' },
    { text: 'Date and time: ______________________________________________________' },
    { text: 'Venue: _____________________________________________________________' },
    { text: 'Short event message: ________________________________________________' },
    { text: '' },
    { text: 'PRODUCTION NOTES', size: 13, bold: true },
    { text: `Target size: ${meta.size}. Keep essential text inside a safe margin, confirm all names and dates, and request a printer proof before full production.` },
    { text: 'Use school-approved logos and photographs only. Obtain permission before including learner images.' },
  ]
}

async function createCover(product) {
  const meta = product.meta
  const style = TYPE_STYLES[meta.type.slug] || TYPE_STYLES.lesson_plans
  const titleLines = wrapWords(product.row.title, 27, 5)
  const titleSvg = titleLines
    .map((line, index) => `<text x="62" y="${330 + index * 57}" font-size="43" font-weight="800" fill="#0f172a">${xmlEscape(line)}</text>`)
    .join('')
  const strand = meta.strand ? ` · ${meta.strand.name}` : ''
  const svg = `
    <svg width="720" height="960" viewBox="0 0 720 960" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="grid" width="36" height="36" patternUnits="userSpaceOnUse">
          <path d="M36 0H0V36" fill="none" stroke="${style.accent}" stroke-opacity="0.09" stroke-width="1"/>
        </pattern>
      </defs>
      <rect width="720" height="960" rx="28" fill="#fffaf3"/>
      <rect width="720" height="960" rx="28" fill="url(#grid)"/>
      <circle cx="635" cy="88" r="165" fill="${style.pale}"/>
      <circle cx="670" cy="865" r="205" fill="${style.pale}"/>
      <rect x="52" y="54" width="250" height="46" rx="23" fill="${style.accent}"/>
      <text x="76" y="84" font-family="Arial, sans-serif" font-size="18" font-weight="700" letter-spacing="2" fill="#ffffff">${style.label}</text>
      <rect x="52" y="145" width="112" height="112" rx="30" fill="${style.pale}" stroke="${style.accent}" stroke-width="2"/>
      <path d="M82 179h52v48H82z M91 190h34 M91 202h34 M91 214h23" fill="none" stroke="${style.accent}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
      <text x="190" y="186" font-family="Arial, sans-serif" font-size="21" font-weight="700" fill="${style.accent}">${xmlEscape(meta.subject.name)}</text>
      <text x="190" y="220" font-family="Arial, sans-serif" font-size="18" font-weight="600" fill="#475569">${xmlEscape(`${meta.grade.name}${strand}`)}</text>
      <g font-family="Arial, sans-serif">${titleSvg}</g>
      <rect x="52" y="695" width="616" height="1" fill="#cbd5e1"/>
      <text x="62" y="746" font-family="Arial, sans-serif" font-size="20" font-weight="700" fill="#334155">${xmlEscape(`${meta.curriculum.label} · Quarter ${meta.quarter.value}`)}</text>
      <text x="62" y="784" font-family="Arial, sans-serif" font-size="18" fill="#64748b">${xmlEscape(`${meta.language.label} · ${meta.modalities[0].label}`)}</text>
      <rect x="52" y="836" width="616" height="68" rx="20" fill="#0f172a"/>
      <text x="82" y="878" font-family="Arial, sans-serif" font-size="19" font-weight="700" letter-spacing="1" fill="#ffffff">AKO MAY LP · STARTER CATALOG</text>
    </svg>`

  return sharp(Buffer.from(svg)).webp({ quality: 82, effort: 3 }).toBuffer()
}

async function loadCatalog() {
  const results = await Promise.all([
    supabase.from('grades').select('id,name,sort_order').eq('is_active', true).order('sort_order'),
    supabase.from('subjects').select('id,name,code').eq('is_active', true).order('name'),
    supabase.from('grade_subjects').select('grade_id,subject_id'),
    supabase.from('strands').select('id,name,code,sort_order').eq('is_active', true).order('sort_order'),
    supabase.from('strand_subjects').select('strand_id,subject_id'),
    supabase.from('product_types').select('id,slug,label,sort_order').eq('is_active', true).order('sort_order'),
    supabase.from('product_type_specific_types').select('product_type_id,value,label,sort_order').eq('is_active', true).order('sort_order'),
    supabase.from('curricula').select('value,label,sort_order').eq('is_active', true).order('sort_order'),
    supabase.from('modalities').select('value,label,sort_order').eq('is_active', true).order('sort_order'),
    supabase.from('languages').select('value,label,sort_order').eq('is_active', true).order('sort_order'),
    supabase.from('teaching_frameworks').select('value,label,sort_order').eq('is_active', true).order('sort_order'),
    supabase.from('quarters').select('value,label,sort_order').eq('is_active', true).order('sort_order'),
  ])

  const labels = [
    'grades',
    'subjects',
    'grade_subjects',
    'strands',
    'strand_subjects',
    'product_types',
    'product_type_specific_types',
    'curricula',
    'modalities',
    'languages',
    'teaching_frameworks',
    'quarters',
  ]
  const values = results.map((result, index) => must(result, `Load ${labels[index]}`))
  const [grades, subjects, gradeSubjects, strands, strandSubjects, productTypes, specificTypes, curricula, modalities, languages, frameworks, quarters] = values

  const required = { grades, subjects, gradeSubjects, strands, productTypes, curricula, modalities, languages, frameworks, quarters }
  for (const [name, rows] of Object.entries(required)) {
    if (rows.length === 0) throw new Error(`The active ${name} catalog is empty.`)
  }

  return {
    grades,
    subjects,
    gradeSubjects,
    strands,
    strandSubjects,
    productTypes,
    specificTypes,
    curricula,
    modalities,
    languages,
    frameworks,
    quarters,
  }
}

function buildShsAssignments(catalog) {
  const shsGrades = catalog.grades.filter((grade) => ['Grade 11', 'Grade 12'].includes(grade.name))
  const subjectById = new Map(catalog.subjects.map((subject) => [subject.id, subject]))
  const coreByGrade = new Map(
    shsGrades.map((grade) => [
      grade.id,
      catalog.gradeSubjects
        .filter((mapping) => mapping.grade_id === grade.id)
        .map((mapping) => subjectById.get(mapping.subject_id))
        .filter(Boolean),
    ])
  )
  const specializedByStrand = new Map(
    catalog.strands.map((strand) => [
      strand.id,
      catalog.strandSubjects
        .filter((mapping) => mapping.strand_id === strand.id)
        .map((mapping) => subjectById.get(mapping.subject_id))
        .filter(Boolean),
    ])
  )
  const assignments = new Map(shsGrades.map((grade) => [grade.id, []]))

  catalog.strands.forEach((strand, strandIndex) => {
    const specialized = specializedByStrand.get(strand.id) || []
    specialized.forEach((subject, subjectIndex) => {
      const grade = shsGrades[(strandIndex + subjectIndex) % shsGrades.length]
      assignments.get(grade.id).push({ strand, subject })
    })
  })

  shsGrades.forEach((grade, gradeIndex) => {
    const target = assignments.get(grade.id)
    const core = coreByGrade.get(grade.id) || []
    core.forEach((subject, subjectIndex) => {
      target.push({ strand: catalog.strands[(gradeIndex + subjectIndex) % catalog.strands.length], subject })
    })

    let cursor = 0
    while (target.length < 48) {
      const strand = catalog.strands[(cursor * 3 + gradeIndex) % catalog.strands.length]
      const choices = uniqueById([...(coreByGrade.get(grade.id) || []), ...(specializedByStrand.get(strand.id) || [])])
      target.push({ strand, subject: choices[cursor % choices.length] })
      cursor += 1
    }
  })

  return { assignments, coreByGrade, specializedByStrand }
}

function buildProducts(catalog, sellerId) {
  const subjectById = new Map(catalog.subjects.map((subject) => [subject.id, subject]))
  const gradeSubjects = new Map(
    catalog.grades.map((grade) => [
      grade.id,
      catalog.gradeSubjects
        .filter((mapping) => mapping.grade_id === grade.id)
        .map((mapping) => subjectById.get(mapping.subject_id))
        .filter(Boolean),
    ])
  )
  const specificTypeByProductType = new Map(
    catalog.productTypes.map((type) => [
      type.id,
      catalog.specificTypes.filter((specificType) => specificType.product_type_id === type.id),
    ])
  )
  const { assignments: shsAssignments, specializedByStrand } = buildShsAssignments(catalog)
  const gradeOccurrences = new Map()
  const titleCounts = new Map()
  const now = Date.now()
  const products = []

  for (let index = 0; index < PRODUCT_COUNT; index += 1) {
    const grade = catalog.grades[index % catalog.grades.length]
    const occurrence = gradeOccurrences.get(grade.id) || 0
    gradeOccurrences.set(grade.id, occurrence + 1)
    const isShs = shsAssignments.has(grade.id)
    const assignment = isShs
      ? shsAssignments.get(grade.id)[occurrence % shsAssignments.get(grade.id).length]
      : { strand: null, subject: gradeSubjects.get(grade.id)[occurrence % gradeSubjects.get(grade.id).length] }
    const strand = assignment.strand
    const subject = assignment.subject
    const type = catalog.productTypes[index % catalog.productTypes.length]
    const specificOptions = specificTypeByProductType.get(type.id) || []
    const specific = specificOptions.length
      ? specificOptions[Math.floor(index / catalog.productTypes.length) % specificOptions.length]
      : null
    const curriculum = ['Kindergarten', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8'].includes(grade.name)
      ? catalog.curricula.find((item) => item.value === 'matatag') || catalog.curricula[0]
      : catalog.curricula.find((item) => item.value === 'k_to_12') || catalog.curricula.at(-1)
    const quarter = catalog.quarters[(index + Math.floor(index / catalog.languages.length)) % catalog.quarters.length]
    const language = catalog.languages[index % catalog.languages.length]
    const primaryModality = catalog.modalities[(index + Math.floor(index / 4)) % catalog.modalities.length]
    const secondaryModality = catalog.modalities[(catalog.modalities.indexOf(primaryModality) + 1) % catalog.modalities.length]
    const selectedModalities = index % 7 === 0 ? [primaryModality, secondaryModality] : [primaryModality]
    const framework = catalog.frameworks[(index * 2 + Math.floor(index / 5)) % catalog.frameworks.length]
    const firstWeek = (index % 9) + 1
    const weeks = index % 4 === 0 ? [firstWeek, (firstWeek % 9) + 1] : [firstWeek]
    const focusAreas = focusAreasFor(subject.code)
    const topic = focusAreas[(occurrence + index) % focusAreas.length]
    const theme = THEMES[index % THEMES.length]
    const size = SIZES[index % SIZES.length]
    const occasion = OCCASIONS[index % OCCASIONS.length]
    const season = SEASONS[index % SEASONS.length]
    const gradeLabel = strand ? `${grade.name} ${strand.name}` : grade.name

    let baseTitle
    if (type.slug === 'lesson_plans') {
      baseTitle = `${subject.name}: ${topic} ${specific?.label || 'Lesson Plan'} — ${gradeLabel} Q${quarter.value}`
    } else if (type.slug === 'exams') {
      baseTitle = `${subject.name}: ${topic} ${specific?.label || 'Assessment'} — ${gradeLabel} Q${quarter.value}`
    } else if (type.slug === 'rpms') {
      baseTitle = `${subject.name} RPMS Evidence Organizer — ${gradeLabel} · ${theme}`
    } else if (type.slug === 'posters') {
      baseTitle = `${topic} Classroom Poster Set — ${gradeLabel} ${subject.name}`
    } else {
      baseTitle = `${occasion} School Tarpaulin Template — ${gradeLabel} · ${subject.name}`
    }
    const duplicateCount = titleCounts.get(baseTitle) || 0
    titleCounts.set(baseTitle, duplicateCount + 1)
    const title = duplicateCount ? `${baseTitle} · Set ${duplicateCount + 1}` : baseTitle

    const productId = deterministicUuid(`akomay:${CATALOG_VERSION}:product:${index + 1}`)
    const sequence = String(index + 1).padStart(3, '0')
    const slug = `${SLUG_PREFIX}-${sequence}-${slugify(title)}`.slice(0, 250).replace(/-+$/g, '')
    const filePath = `${sellerId}/${STORAGE_PREFIX}/${productId}/${slug}.pdf`
    const coverPath = `${sellerId}/${STORAGE_PREFIX}/${productId}/cover.webp`
    const coverImageUrl = supabase.storage.from('product-images').getPublicUrl(coverPath).data.publicUrl
    const compatibleSubjects = isShs
      ? uniqueById([...(gradeSubjects.get(grade.id) || []), ...(specializedByStrand.get(strand.id) || [])])
      : gradeSubjects.get(grade.id)
    const subjectPosition = Math.max(0, compatibleSubjects.findIndex((item) => item.id === subject.id))
    const secondarySubject = compatibleSubjects[(subjectPosition + 1) % compatibleSubjects.length]
    const subjectIds = index % 3 === 0 && secondarySubject?.id !== subject.id
      ? [subject.id, secondarySubject.id]
      : [subject.id]
    // A coprime permutation keeps the newest feed visually varied instead of
    // clustering products whose category cycles share the same factors.
    // Its inverse modulo 500 is 73, so recency order rotates through product
    // types, languages, and grades before repeating any one of them.
    const recencyRank = (index * 137) % PRODUCT_COUNT
    const ageInDays = (recencyRank * 120) / PRODUCT_COUNT
    const publishedAt = new Date(now - ageInDays * 86_400_000).toISOString()
    const badges = []
    if (index % 13 === 0) badges.push('featured')
    if (ageInDays < 30) badges.push('new')
    const typeSpecific = {
      lesson_plans: { specificType: specific?.value || 'dll' },
      exams: { specificType: specific?.value || 'summative_test' },
      rpms: { specificType: 'evidence_organizer' },
      posters: { specificType: 'classroom_poster' },
      tarpaulins: { specificType: 'school_event_banner' },
    }[type.slug] || { specificType: null }
    const description = [
      `A platform-curated ${type.label.toLowerCase()} starter resource for ${gradeLabel} ${subject.name}, organized around ${topic.toLowerCase()}.`,
      `Tagged for ${curriculum.label}, Quarter ${quarter.value}, ${language.label}, ${selectedModalities.map((item) => item.label).join(' and ')}, and the ${framework.label} teaching framework.`,
      `The downloadable PDF includes a practical structure, classroom-use prompts, and adaptation notes. Teachers should review and localize examples, pacing, and language before use with learners.`,
    ].join('\n\n')

    const meta = {
      type,
      grade,
      strand,
      subject,
      curriculum,
      quarter,
      language,
      modalities: selectedModalities,
      framework,
      weeks,
      topic,
      theme,
      size,
      occasion,
      season,
    }
    const row = {
      id: productId,
      seller_id: sellerId,
      title,
      description,
      slug,
      price: 50 + (index % 16) * 15,
      grade_id: grade.id,
      subject_id: subject.id,
      quarter: Number(quarter.value),
      weeks,
      product_type: type.slug,
      specific_type: typeSpecific.specificType,
      theme: ['rpms', 'posters'].includes(type.slug) ? theme : null,
      size: ['posters', 'tarpaulins'].includes(type.slug) ? size : null,
      season: type.slug === 'tarpaulins' ? season : null,
      occasion: type.slug === 'tarpaulins' ? occasion : null,
      language: language.value,
      curriculum: curriculum.value,
      modalities: selectedModalities.map((item) => item.value),
      teaching_framework: framework.value,
      class_type: 'regular',
      strand_id: strand?.id || null,
      file_urls: [filePath],
      cover_image_url: coverImageUrl,
      preview_images: [coverImageUrl],
      watermark_enabled: true,
      current_version: 1,
      changelog: 'Initial platform starter-catalog edition.',
      original_created_at: publishedAt,
      status: 'published',
      review_count: 0,
      views_count: 0,
      unique_views_count: 0,
      sales_count: 0,
      conversion_rate: null,
      avg_rating: null,
      reviews_count: 0,
      badges: badges.length ? badges : null,
      search_score: 0,
      created_at: publishedAt,
      published_at: publishedAt,
    }

    products.push({ row, subjectIds, filePath, coverPath, meta })
  }

  return products
}

function countBy(values, selector) {
  const counts = {}
  for (const value of values) {
    const selected = selector(value)
    for (const key of Array.isArray(selected) ? selected : [selected]) {
      if (key == null) continue
      counts[key] = (counts[key] || 0) + 1
    }
  }
  return counts
}

function requireCoverage(name, expected, actualCounts) {
  const missing = expected.filter((value) => !actualCounts[value])
  if (missing.length) throw new Error(`${name} coverage is missing: ${missing.join(', ')}`)
}

function printCoverage(catalog, products) {
  const typeCounts = countBy(products, (product) => product.row.product_type)
  const gradeCounts = countBy(products, (product) => product.row.grade_id)
  const strandCounts = countBy(products, (product) => product.row.strand_id)
  const subjectCounts = countBy(products, (product) => product.subjectIds)
  const curriculumCounts = countBy(products, (product) => product.row.curriculum)
  const modalityCounts = countBy(products, (product) => product.row.modalities)
  const languageCounts = countBy(products, (product) => product.row.language)
  const frameworkCounts = countBy(products, (product) => product.row.teaching_framework)
  const quarterCounts = countBy(products, (product) => String(product.row.quarter))
  const weekCounts = countBy(products, (product) => product.row.weeks.map(String))
  const specificExpected = catalog.specificTypes.map((item) => item.value)
  const specificCounts = countBy(products, (product) => product.row.specific_type)

  requireCoverage('Product type', catalog.productTypes.map((item) => item.slug), typeCounts)
  requireCoverage('Grade', catalog.grades.map((item) => item.id), gradeCounts)
  requireCoverage('Strand', catalog.strands.map((item) => item.id), strandCounts)
  requireCoverage('Subject', [...new Set([...catalog.gradeSubjects, ...catalog.strandSubjects].map((item) => item.subject_id))], subjectCounts)
  requireCoverage('Curriculum', catalog.curricula.map((item) => item.value), curriculumCounts)
  requireCoverage('Modality', catalog.modalities.map((item) => item.value), modalityCounts)
  requireCoverage('Language', catalog.languages.map((item) => item.value), languageCounts)
  requireCoverage('Teaching framework', catalog.frameworks.map((item) => item.value), frameworkCounts)
  requireCoverage('Quarter', catalog.quarters.map((item) => item.value), quarterCounts)
  requireCoverage('Week', ['1', '2', '3', '4', '5', '6', '7', '8', '9'], weekCounts)
  requireCoverage('Specific type', specificExpected, specificCounts)

  const namedCounts = (items, counts, key, label) => Object.fromEntries(items.map((item) => [item[label], counts[item[key]] || 0]))
  console.log('\nPlanned coverage:')
  console.log('  Product types:', namedCounts(catalog.productTypes, typeCounts, 'slug', 'label'))
  console.log('  Grades:', namedCounts(catalog.grades, gradeCounts, 'id', 'name'))
  console.log('  Strands:', namedCounts(catalog.strands, strandCounts, 'id', 'name'))
  console.log('  Curricula:', namedCounts(catalog.curricula, curriculumCounts, 'value', 'label'))
  console.log('  Modalities:', namedCounts(catalog.modalities, modalityCounts, 'value', 'label'))
  console.log('  Languages:', namedCounts(catalog.languages, languageCounts, 'value', 'label'))
  console.log('  Teaching frameworks:', namedCounts(catalog.frameworks, frameworkCounts, 'value', 'label'))
  console.log('  Quarters:', namedCounts(catalog.quarters, quarterCounts, 'value', 'label'))
  console.log(`  Subjects covered: ${Object.keys(subjectCounts).length}`)
  console.log('  Weeks covered:', weekCounts)
}

async function ensureSeller(catalog) {
  const profileResult = await supabase
    .from('users')
    .select('id,email')
    .eq('email', SELLER_EMAIL)
    .maybeSingle()
  if (profileResult.error) throw new Error(`Find seed seller: ${profileResult.error.message}`)

  let sellerId = profileResult.data?.id
  if (!sellerId) {
    const password = randomBytes(36).toString('base64url')
    const authResult = await supabase.auth.admin.createUser({
      email: SELLER_EMAIL,
      password,
      email_confirm: true,
      user_metadata: {
        name: 'AkoMay Resource Team',
        first_name: 'AkoMay',
        last_name: 'Resource Team',
        role: 'seller',
      },
    })
    if (authResult.error || !authResult.data.user) {
      throw new Error(`Create seed seller: ${authResult.error?.message || 'No user returned'}`)
    }
    sellerId = authResult.data.user.id
  }

  const profile = {
    id: sellerId,
    email: SELLER_EMAIL,
    first_name: 'AkoMay',
    last_name: 'Resource Team',
    display_name: 'AkoMay Official Resources',
    username: SELLER_USERNAME,
    role: 'seller',
    is_verified_teacher: true,
    can_sell: true,
    email_verified: true,
    email_verified_at: new Date().toISOString(),
    bio: 'Official platform starter resources maintained by the Ako May Lesson Plan Na content team.',
    subjects_taught: ['Platform-curated classroom resources'],
    grade_levels_taught: catalog.grades.map((grade) => grade.name),
    location_city: 'Online',
    location_region: 'Philippines',
    subscription_tier: 'free',
    profile_completion_percent: 100,
    shop_name: 'AkoMay Official Resources',
    shop_description: 'Starter lesson plans, assessments, professional tools, posters, and school-event templates for Filipino educators.',
    auto_publish: true,
    teaching_class_types: ['regular'],
    teaching_strand_ids: catalog.strands.map((strand) => strand.id),
  }
  const upsertResult = await supabase.from('users').upsert(profile, { onConflict: 'id' })
  if (upsertResult.error) throw new Error(`Upsert seed seller profile: ${upsertResult.error.message}`)
  return sellerId
}

async function retryUpload(bucket, path, body, options) {
  let lastError
  for (let attempt = 1; attempt <= 4; attempt += 1) {
    const result = await supabase.storage.from(bucket).upload(path, body, options)
    if (!result.error) return
    lastError = result.error
    await sleep(300 * 2 ** (attempt - 1))
  }
  throw new Error(`Upload ${bucket}/${path}: ${lastError?.message || 'Unknown storage error'}`)
}

async function uploadAssets(products) {
  let cursor = 0
  let completed = 0
  const failures = []

  async function worker() {
    while (cursor < products.length) {
      const index = cursor
      cursor += 1
      const product = products[index]
      try {
        const [pdf, cover] = await Promise.all([
          Promise.resolve(createPdf(resourceBlocks(product))),
          createCover(product),
        ])
        await Promise.all([
          retryUpload('product-files', product.filePath, pdf, {
            cacheControl: '3600',
            contentType: 'application/pdf',
            upsert: true,
          }),
          retryUpload('product-images', product.coverPath, cover, {
            cacheControl: '31536000',
            contentType: 'image/webp',
            upsert: true,
          }),
        ])
        completed += 1
        if (completed % 25 === 0 || completed === products.length) {
          console.log(`  Uploaded assets for ${completed}/${products.length} resources`)
        }
      } catch (error) {
        failures.push(`${product.row.slug}: ${error instanceof Error ? error.message : String(error)}`)
      }
    }
  }

  await Promise.all(Array.from({ length: uploadConcurrency }, () => worker()))
  if (failures.length) {
    throw new Error(`Asset uploads failed for ${failures.length} resources. First failures:\n${failures.slice(0, 5).join('\n')}`)
  }
}

async function upsertProducts(products) {
  let completed = 0
  for (const batch of chunk(products, 50)) {
    const productResult = await supabase
      .from('products')
      .upsert(batch.map((product) => product.row), { onConflict: 'id' })
    if (productResult.error) throw new Error(`Upsert product batch: ${productResult.error.message}`)

    const subjectRows = batch.flatMap((product) =>
      product.subjectIds.map((subjectId, sortOrder) => ({
        product_id: product.row.id,
        subject_id: subjectId,
        sort_order: sortOrder,
      }))
    )
    const subjectResult = await supabase
      .from('product_subjects')
      .upsert(subjectRows, { onConflict: 'product_id,subject_id' })
    if (subjectResult.error) throw new Error(`Upsert product subjects: ${subjectResult.error.message}`)

    completed += batch.length
    console.log(`  Upserted ${completed}/${products.length} product records`)
  }
}

async function loadSeededRows() {
  const result = await supabase
    .from('products')
    .select('id,slug,status,product_type,grade_id,subject_id,strand_id,curriculum,modalities,language,teaching_framework,quarter,weeks,file_urls,cover_image_url,seller_id')
    .like('slug', `${SLUG_PREFIX}-%`)
    .order('slug')
    .range(0, PRODUCT_COUNT + 50)
  return must(result, 'Verify seeded products')
}

async function verifyRemote(products) {
  const rows = await loadSeededRows()
  if (rows.length !== PRODUCT_COUNT) {
    throw new Error(`Expected ${PRODUCT_COUNT} seeded products, found ${rows.length}.`)
  }
  const publishedCount = rows.filter((row) => row.status === 'published').length
  const fileCount = rows.filter((row) => Array.isArray(row.file_urls) && row.file_urls.length > 0).length
  const coverCount = rows.filter((row) => row.cover_image_url).length
  if (publishedCount !== PRODUCT_COUNT || fileCount !== PRODUCT_COUNT || coverCount !== PRODUCT_COUNT) {
    throw new Error(`Remote verification failed: published=${publishedCount}, files=${fileCount}, covers=${coverCount}.`)
  }

  const samples = [products[0], products[Math.floor(products.length / 2)], products.at(-1)]
  for (const sample of samples) {
    const signed = await supabase.storage.from('product-files').createSignedUrl(sample.filePath, 60)
    if (signed.error || !signed.data?.signedUrl) throw new Error(`Sign sample PDF: ${signed.error?.message || 'No URL returned'}`)
    const pdfResponse = await fetch(signed.data.signedUrl, { headers: { Range: 'bytes=0-4' } })
    const signature = Buffer.from(await pdfResponse.arrayBuffer()).subarray(0, 5).toString()
    if (!pdfResponse.ok || signature !== '%PDF-') throw new Error(`Invalid sample PDF for ${sample.row.slug}.`)

    const coverResponse = await fetch(sample.row.cover_image_url)
    if (!coverResponse.ok || !coverResponse.headers.get('content-type')?.includes('image/webp')) {
      throw new Error(`Invalid sample cover for ${sample.row.slug}.`)
    }
  }

  console.log('\nRemote verification:')
  console.log(`  Published products: ${publishedCount}`)
  console.log(`  Products with downloadable PDFs: ${fileCount}`)
  console.log(`  Products with WebP covers: ${coverCount}`)
  console.log('  Signed PDF and public cover checks: 3/3 passed')
}

async function main() {
  console.log(`Marketplace starter catalog ${CATALOG_VERSION}`)
  console.log(`Mode: ${VERIFY_ONLY ? 'verify only' : APPLY ? 'apply' : 'dry run'}`)
  const catalog = await loadCatalog()

  if (VERIFY_ONLY) {
    const sellerResult = await supabase.from('users').select('id').eq('email', SELLER_EMAIL).maybeSingle()
    if (sellerResult.error || !sellerResult.data) throw new Error('The official seed seller does not exist yet.')
    const products = buildProducts(catalog, sellerResult.data.id)
    printCoverage(catalog, products)
    await verifyRemote(products)
    return
  }

  const placeholderSellerId = deterministicUuid(`akomay:${CATALOG_VERSION}:seller-placeholder`)
  const plannedProducts = buildProducts(catalog, placeholderSellerId)
  printCoverage(catalog, plannedProducts)

  if (!APPLY) {
    console.log('\nDry run complete. Re-run with --apply to create the official seller, files, covers, and product records.')
    return
  }

  console.log('\nPreparing the official resource-team seller...')
  const sellerId = await ensureSeller(catalog)
  const products = buildProducts(catalog, sellerId)

  console.log(`\nUploading ${products.length} PDFs and ${products.length} cover images with concurrency ${uploadConcurrency}...`)
  await uploadAssets(products)
  console.log('\nWriting marketplace records...')
  await upsertProducts(products)
  await verifyRemote(products)
  console.log(`\nSeed complete: ${PRODUCT_COUNT} marketplace resources are published.`)
}

main().catch((error) => {
  console.error(`\nSeed failed: ${error instanceof Error ? error.message : String(error)}`)
  process.exitCode = 1
})
