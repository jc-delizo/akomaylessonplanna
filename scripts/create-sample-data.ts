import { config } from 'dotenv'
import { resolve } from 'path'
import { createAdminClient } from '../lib/supabase/admin'
import { writeFileSync } from 'fs'
import { join } from 'path'

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') })

interface SellerData {
  email: string
  password: string
  first_name: string
  last_name: string
  name?: string // For backward compatibility
  username: string
  bio: string
  subjects_taught: string[]
  grade_levels_taught: string[]
  location_city: string
  location_region: string
  subscription_tier: 'free' | 'pro' | 'pioneer'
  userId?: string
}

interface ProductData {
  seller_id: string
  title: string
  description: string
  slug: string
  price: number
  grade_id: string
  subject_id: string
  quarter?: number
  weeks?: number[]
  product_type: string
  specific_type: string
  theme?: string
  size?: string
  season?: string
  occasion?: string
  file_urls: string[]
  cover_image_url: string
  preview_images: string[]
  status: string
  published_at: string
  views_count: number
  sales_count: number
  avg_rating: number
}

interface Grade {
  id: string
  name: string
  sort_order: number
}

interface Subject {
  id: string
  name: string
  code: string
}

interface GradeSubject {
  grade_id: string
  subject_id: string
}

// Sample seller data
const sellerTemplates: Omit<SellerData, 'email' | 'password' | 'username' | 'userId'>[] = [
  {
    name: 'Maria Santos',
    bio: 'Experienced Mathematics teacher with 10 years of teaching Grade 7-10. Passionate about making math fun and accessible.',
    subjects_taught: ['Mathematics', 'Algebra'],
    grade_levels_taught: ['Grade 7', 'Grade 8', 'Grade 9', 'Grade 10'],
    location_city: 'Manila',
    location_region: 'NCR',
    subscription_tier: 'pro'
  },
  {
    name: 'Juan dela Cruz',
    bio: 'Science teacher specializing in Biology and Chemistry. Creating engaging lesson plans for junior high school.',
    subjects_taught: ['Science', 'Biology', 'Chemistry'],
    grade_levels_taught: ['Grade 7', 'Grade 8', 'Grade 9'],
    location_city: 'Quezon City',
    location_region: 'NCR',
    subscription_tier: 'free'
  },
  {
    name: 'Ana Garcia',
    bio: 'Elementary teacher focused on Grade 1-3. Expert in creating colorful and interactive learning materials.',
    subjects_taught: ['Mathematics', 'English', 'Filipino'],
    grade_levels_taught: ['Grade 1', 'Grade 2', 'Grade 3'],
    location_city: 'Makati',
    location_region: 'NCR',
    subscription_tier: 'pioneer'
  },
  {
    name: 'Carlos Rodriguez',
    bio: 'English teacher for senior high school. Specializing in literature and creative writing.',
    subjects_taught: ['English', 'Literature'],
    grade_levels_taught: ['Grade 11', 'Grade 12'],
    location_city: 'Cebu City',
    location_region: 'Central Visayas',
    subscription_tier: 'pro'
  },
  {
    name: 'Liza Fernandez',
    bio: 'Filipino language teacher with expertise in Araling Panlipunan. Creating culturally relevant teaching materials.',
    subjects_taught: ['Filipino', 'Araling Panlipunan'],
    grade_levels_taught: ['Grade 4', 'Grade 5', 'Grade 6'],
    location_city: 'Davao City',
    location_region: 'Davao Region',
    subscription_tier: 'free'
  },
  {
    name: 'Roberto Tan',
    bio: 'MAPEH teacher passionate about arts and physical education. Creating visual materials and activity guides.',
    subjects_taught: ['Music, Arts, Physical Education, and Health', 'Physical Education'],
    grade_levels_taught: ['Grade 7', 'Grade 8', 'Grade 9', 'Grade 10'],
    location_city: 'Iloilo City',
    location_region: 'Western Visayas',
    subscription_tier: 'pro'
  },
  {
    name: 'Grace Lim',
    bio: 'Kindergarten teacher creating fun and educational materials for early childhood learning.',
    subjects_taught: ['Mother Tongue', 'Reading', 'Writing'],
    grade_levels_taught: ['Kindergarten'],
    location_city: 'Bacolod',
    location_region: 'Western Visayas',
    subscription_tier: 'free'
  },
  {
    name: 'Michael Torres',
    bio: 'TLE teacher specializing in computer and technology education. Creating practical and modern lesson plans.',
    subjects_taught: ['Technology and Livelihood Education', 'Computer'],
    grade_levels_taught: ['Grade 7', 'Grade 8', 'Grade 9', 'Grade 10'],
    location_city: 'Pasig',
    location_region: 'NCR',
    subscription_tier: 'pioneer'
  },
  {
    name: 'Patricia Reyes',
    bio: 'ESP teacher focused on values education and character development. Creating meaningful teaching resources.',
    subjects_taught: ['Edukasyon sa Pagpapakatao', 'Values Education'],
    grade_levels_taught: ['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4'],
    location_city: 'Caloocan',
    location_region: 'NCR',
    subscription_tier: 'free'
  },
  {
    name: 'James Villanueva',
    bio: 'Senior high school teacher specializing in STEM subjects. Creating advanced lesson plans and exam materials.',
    subjects_taught: ['General Mathematics', 'Statistics and Probability', 'General Physics'],
    grade_levels_taught: ['Grade 11', 'Grade 12'],
    location_city: 'Taguig',
    location_region: 'NCR',
    subscription_tier: 'pro'
  },
  {
    name: 'Michelle Cruz',
    bio: 'Grade 6 teacher creating comprehensive lesson plans and assessment tools for elementary students.',
    subjects_taught: ['Mathematics', 'Science', 'English'],
    grade_levels_taught: ['Grade 6'],
    location_city: 'Mandaluyong',
    location_region: 'NCR',
    subscription_tier: 'free'
  },
  {
    name: 'Ronald Aquino',
    bio: 'RPMS specialist creating professional cover pages and portfolio templates for teacher evaluations.',
    subjects_taught: ['All Subjects'],
    grade_levels_taught: ['All Grades'],
    location_city: 'Las Piñas',
    location_region: 'NCR',
    subscription_tier: 'pro'
  },
  {
    name: 'Jennifer Ong',
    bio: 'Visual materials creator specializing in posters and classroom decorations. Making learning spaces beautiful.',
    subjects_taught: ['All Subjects'],
    grade_levels_taught: ['All Grades'],
    location_city: 'Marikina',
    location_region: 'NCR',
    subscription_tier: 'pioneer'
  },
  {
    name: 'Mark Alcantara',
    bio: 'Event materials designer creating tarpaulins and banners for school events and celebrations.',
    subjects_taught: ['All Subjects'],
    grade_levels_taught: ['All Grades'],
    location_city: 'Paranaque',
    location_region: 'NCR',
    subscription_tier: 'free'
  },
  {
    name: 'Sarah Mendoza',
    bio: 'Grade 9-10 teacher specializing in Science and Mathematics. Creating detailed lesson plans and exams.',
    subjects_taught: ['Science', 'Mathematics', 'General Chemistry'],
    grade_levels_taught: ['Grade 9', 'Grade 10'],
    location_city: 'Valenzuela',
    location_region: 'NCR',
    subscription_tier: 'pro'
  },
  {
    name: 'David Ramos',
    bio: 'Grade 2 teacher creating engaging and interactive lesson plans for young learners.',
    subjects_taught: ['Mathematics', 'English', 'Filipino', 'Mother Tongue'],
    grade_levels_taught: ['Grade 2'],
    location_city: 'Muntinlupa',
    location_region: 'NCR',
    subscription_tier: 'free'
  },
  {
    name: 'Catherine Bautista',
    bio: 'Grade 8 teacher with expertise in Algebra and Geometry. Creating comprehensive teaching materials.',
    subjects_taught: ['Mathematics', 'Algebra', 'Geometry'],
    grade_levels_taught: ['Grade 8'],
    location_city: 'San Juan',
    location_region: 'NCR',
    subscription_tier: 'pro'
  },
  {
    name: 'Paul Martinez',
    bio: 'Grade 4 teacher creating colorful and educational materials for intermediate students.',
    subjects_taught: ['Mathematics', 'Science', 'Araling Panlipunan'],
    grade_levels_taught: ['Grade 4'],
    location_city: 'Navotas',
    location_region: 'NCR',
    subscription_tier: 'free'
  },
  {
    name: 'Rachel Gutierrez',
    bio: 'Grade 7 teacher specializing in English and Filipino. Creating language learning resources.',
    subjects_taught: ['English', 'Filipino'],
    grade_levels_taught: ['Grade 7'],
    location_city: 'Malabon',
    location_region: 'NCR',
    subscription_tier: 'pro'
  },
  {
    name: 'John Estrada',
    bio: 'Multi-grade teacher creating versatile teaching materials for Grades 5-6. Expert in curriculum alignment.',
    subjects_taught: ['Mathematics', 'Science', 'English', 'Filipino'],
    grade_levels_taught: ['Grade 5', 'Grade 6'],
    location_city: 'Pasay',
    location_region: 'NCR',
    subscription_tier: 'pioneer'
  }
]

function generatePassword(): string {
  const length = 12
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let password = ''
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length))
  }
  return password
}

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .substring(0, 255)
}

function generateImageUrl(keywords: string[], width = 1200, height = 800): string {
  // Use picsum.photos (Lorem Picsum) - a reliable placeholder image service
  // It provides random images from Unsplash but through a working API
  // Using random seed based on keywords to get different images
  const seed = keywords.join('').split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  return `https://picsum.photos/seed/${seed}/${width}/${height}`
}

function generatePreviewImages(keywords: string[]): string[] {
  // Generate 3 different preview images with different seeds
  const baseSeed = keywords.join('').split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  return [
    `https://picsum.photos/seed/${baseSeed + 1}/1200/800`,
    `https://picsum.photos/seed/${baseSeed + 2}/1200/800`,
    `https://picsum.photos/seed/${baseSeed + 3}/1200/800`
  ]
}

function generateFileUrl(fileType: 'pdf' | 'docx' | 'pptx' = 'pdf'): string {
  // Using placeholder URLs - in production these would be actual Supabase Storage URLs
  const extensions = {
    pdf: 'pdf',
    docx: 'docx',
    pptx: 'pptx'
  }
  return `https://via.placeholder.com/800x1000/4A90E2/FFFFFF?text=Sample+${fileType.toUpperCase()}+File`
}

async function queryGradesAndSubjects(supabase: ReturnType<typeof createAdminClient>) {
  console.log('📚 Querying grades and subjects from database...')
  
  const { data: grades, error: gradesError } = await supabase
    .from('grades')
    .select('id, name, sort_order')
    .order('sort_order')

  if (gradesError) {
    throw new Error(`Failed to query grades: ${gradesError.message}`)
  }

  const { data: subjects, error: subjectsError } = await supabase
    .from('subjects')
    .select('id, name, code')

  if (subjectsError) {
    throw new Error(`Failed to query subjects: ${subjectsError.message}`)
  }

  const { data: gradeSubjects, error: gsError } = await supabase
    .from('grade_subjects')
    .select('grade_id, subject_id')

  if (gsError) {
    throw new Error(`Failed to query grade_subjects: ${gsError.message}`)
  }

  console.log(`✓ Found ${grades?.length || 0} grades and ${subjects?.length || 0} subjects`)
  
  return { grades: grades || [], subjects: subjects || [], gradeSubjects: gradeSubjects || [] }
}

function findValidSubjectForGrade(
  gradeId: string,
  subjects: Subject[],
  gradeSubjects: GradeSubject[]
): Subject | null {
  const validSubjectIds = gradeSubjects
    .filter(gs => gs.grade_id === gradeId)
    .map(gs => gs.subject_id)
  
  const validSubjects = subjects.filter(s => validSubjectIds.includes(s.id))
  return validSubjects.length > 0 ? validSubjects[Math.floor(Math.random() * validSubjects.length)] : null
}

async function createSeller(
  supabase: ReturnType<typeof createAdminClient>,
  template: Omit<SellerData, 'email' | 'password' | 'username' | 'userId'>,
  index: number
): Promise<SellerData | null> {
  const email = `seller${index + 1}@akomaylessonplanna.test`
  const password = generatePassword()
  // Split name into first and last
  const nameParts = template.name.trim().split(' ')
  const firstName = nameParts[0] || 'Seller'
  const lastName = nameParts.slice(1).join(' ') || ''
  const fullName = `${firstName} ${lastName}`.trim()
  const username = fullName.toLowerCase().replace(/\s+/g, '_').substring(0, 20)

  try {
    console.log(`\n👤 Creating seller ${index + 1}/20: ${fullName}`)

    // Step 1: Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        name: fullName,
        first_name: firstName,
        last_name: lastName,
        role: 'seller',
      },
    })

    if (authError) {
      console.error(`  ❌ Failed to create auth user: ${authError.message}`)
      return null
    }

    if (!authData.user) {
      console.error(`  ❌ Auth user creation returned no user`)
      return null
    }

    // Step 2: Wait for trigger
    await new Promise(resolve => setTimeout(resolve, 500))

    // Step 3: Create/update profile
    const { error: profileError } = await supabase
      .from('users')
      .upsert({
        id: authData.user.id,
        email,
        first_name: firstName,
        last_name: lastName,
        username,
        role: 'seller',
        is_verified_teacher: true,
        can_sell: true,
        email_verified: true,
        email_verified_at: new Date().toISOString(),
        bio: template.bio,
        subjects_taught: template.subjects_taught,
        grade_levels_taught: template.grade_levels_taught,
        location_city: template.location_city,
        location_region: template.location_region,
        subscription_tier: template.subscription_tier,
        profile_completion_percent: 85,
      }, {
        onConflict: 'id'
      })

    if (profileError) {
      console.error(`  ❌ Failed to create profile: ${profileError.message}`)
      // Try to clean up auth user
      await supabase.auth.admin.deleteUser(authData.user.id).catch(() => {})
      return null
    }

    console.log(`  ✓ Seller created: ${email}`)
    
    return {
      email,
      password,
      first_name: firstName,
      last_name: lastName,
      name: fullName, // For backward compatibility
      username,
      bio: template.bio,
      subjects_taught: template.subjects_taught,
      grade_levels_taught: template.grade_levels_taught,
      location_city: template.location_city,
      location_region: template.location_region,
      subscription_tier: template.subscription_tier,
      userId: authData.user.id
    }
  } catch (error) {
    console.error(`  ❌ Error creating seller: ${error instanceof Error ? error.message : 'Unknown error'}`)
    return null
  }
}

async function createProducts(
  supabase: ReturnType<typeof createAdminClient>,
  sellers: SellerData[],
  grades: Grade[],
  subjects: Subject[],
  gradeSubjects: GradeSubject[]
) {
  console.log('\n📦 Creating 30 products...\n')

  const products: ProductData[] = []
  let productIndex = 0

  // Helper to get random seller
  const getRandomSeller = () => sellers[Math.floor(Math.random() * sellers.length)]

  // Helper to get random grade
  const getRandomGrade = () => grades[Math.floor(Math.random() * grades.length)]

  // Helper to get valid subject for grade
  const getValidSubject = (gradeId: string) => {
    return findValidSubjectForGrade(gradeId, subjects, gradeSubjects)
  }

  // Exams (6 products)
  console.log('Creating Exams (6 products)...')
  for (let i = 0; i < 6; i++) {
    const seller = getRandomSeller()
    const grade = getRandomGrade()
    const subject = getValidSubject(grade.id)
    
    if (!subject || !seller.userId) {
      console.log(`  ⚠️  Skipping exam ${i + 1} - invalid grade/subject combination`)
      continue
    }

    const isPeriodical = i < 3
    const quarter = Math.floor(Math.random() * 4) + 1
    const title = isPeriodical
      ? `${subject.name} Periodical Exam - ${grade.name} - Quarter ${quarter}`
      : `${subject.name} Summative Test - ${grade.name} - Quarter ${quarter}`

    products.push({
      seller_id: seller.userId,
      title,
      description: `Comprehensive ${isPeriodical ? 'periodical exam' : 'summative test'} for ${grade.name} ${subject.name}, Quarter ${quarter}. Includes answer key and rubric.`,
      slug: generateSlug(title),
      price: Math.floor(Math.random() * 450) + 50, // ₱50-₱500
      grade_id: grade.id,
      subject_id: subject.id,
      quarter,
      product_type: 'Exams',
      specific_type: isPeriodical ? 'Periodical Exam' : 'Summative Test',
      file_urls: [generateFileUrl('pdf')],
      cover_image_url: generateImageUrl(['education', 'exam', 'test', 'assessment']),
      preview_images: generatePreviewImages(['education', 'exam', 'test']),
      status: 'published',
      published_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      views_count: Math.floor(Math.random() * 500) + 10,
      sales_count: Math.floor(Math.random() * 50),
      avg_rating: Math.random() * 1 + 4.0 // 4.0-5.0
    })
    productIndex++
    console.log(`  ✓ Created: ${title}`)
  }

  // Lesson Plans (8 products)
  console.log('\nCreating Lesson Plans (8 products)...')
  for (let i = 0; i < 8; i++) {
    const seller = getRandomSeller()
    const grade = getRandomGrade()
    const subject = getValidSubject(grade.id)
    
    if (!subject || !seller.userId) {
      console.log(`  ⚠️  Skipping lesson plan ${i + 1} - invalid grade/subject combination`)
      continue
    }

    const isDLL = i < 4
    const quarter = Math.floor(Math.random() * 4) + 1
    const weekCount = Math.floor(Math.random() * 3) + 1 // 1-3 weeks
    const weeks = Array.from({ length: weekCount }, (_, idx) => idx + 1)
    const title = isDLL
      ? `${subject.name} DLL - ${grade.name} - Quarter ${quarter} - Weeks ${weeks.join(', ')}`
      : `${subject.name} DLP - ${grade.name} - Quarter ${quarter} - Weeks ${weeks.join(', ')}`

    products.push({
      seller_id: seller.userId,
      title,
      description: `Detailed ${isDLL ? 'Daily Lesson Log (DLL)' : 'Detailed Lesson Plan (DLP)'} for ${grade.name} ${subject.name}, Quarter ${quarter}, Weeks ${weeks.join(', ')}. Includes objectives, activities, and assessments.`,
      slug: generateSlug(title),
      price: Math.floor(Math.random() * 450) + 50, // ₱50-₱500
      grade_id: grade.id,
      subject_id: subject.id,
      quarter,
      weeks,
      product_type: 'Lesson Plans',
      specific_type: isDLL ? 'DLL' : 'DLP',
      file_urls: [generateFileUrl('docx')],
      cover_image_url: generateImageUrl(['lesson', 'plan', 'education', 'teaching']),
      preview_images: generatePreviewImages(['lesson', 'plan', 'education']),
      status: 'published',
      published_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      views_count: Math.floor(Math.random() * 500) + 10,
      sales_count: Math.floor(Math.random() * 50),
      avg_rating: Math.random() * 1 + 4.0
    })
    productIndex++
    console.log(`  ✓ Created: ${title}`)
  }

  // RPMS (6 products)
  console.log('\nCreating RPMS (6 products)...')
  const rpmsThemes = ['Safari', 'Abstract', 'Floral', 'Modern', 'Classic', 'Nature']
  for (let i = 0; i < 6; i++) {
    const seller = getRandomSeller()
    const theme = rpmsThemes[i]
    
    if (!seller.userId) continue

    const title = `RPMS Cover Page - ${theme} Theme`

    products.push({
      seller_id: seller.userId,
      title,
      description: `Professional RPMS (Results-Based Performance Management System) cover page with ${theme.toLowerCase()} theme. Perfect for teacher portfolio and principal review.`,
      slug: generateSlug(title),
      price: Math.floor(Math.random() * 200) + 50, // ₱50-₱250
      grade_id: grades[0].id, // RPMS doesn't require specific grade
      subject_id: subjects[0].id, // RPMS doesn't require specific subject
      product_type: 'RPMS',
      specific_type: 'Cover Page',
      theme,
      file_urls: [generateFileUrl('pdf'), generateFileUrl('docx')],
      cover_image_url: generateImageUrl(['portfolio', 'cover', theme.toLowerCase(), 'professional']),
      preview_images: generatePreviewImages(['portfolio', 'cover', theme.toLowerCase()]),
      status: 'published',
      published_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      views_count: Math.floor(Math.random() * 300) + 20,
      sales_count: Math.floor(Math.random() * 30),
      avg_rating: Math.random() * 1 + 4.0
    })
    productIndex++
    console.log(`  ✓ Created: ${title}`)
  }

  // Posters (5 products)
  console.log('\nCreating Posters (5 products)...')
  const posterThemes = ['Educational', 'Motivational', 'Classroom Rules', 'Science Facts', 'Math Concepts']
  const posterSizes = ['A4', '8x10', '11x14', 'A3', 'Letter']
  for (let i = 0; i < 5; i++) {
    const seller = getRandomSeller()
    const theme = posterThemes[i]
    const size = posterSizes[i]
    
    if (!seller.userId) continue

    const title = `Educational Poster - ${theme} (${size})`

    products.push({
      seller_id: seller.userId,
      title,
      description: `High-quality educational poster featuring ${theme.toLowerCase()} content. Size: ${size}. Perfect for classroom decoration and visual learning.`,
      slug: generateSlug(title),
      price: Math.floor(Math.random() * 200) + 50, // ₱50-₱250
      grade_id: grades[0].id,
      subject_id: subjects[0].id,
      product_type: 'Posters',
      specific_type: 'Educational Poster',
      theme,
      size,
      file_urls: [generateFileUrl('pdf'), generateFileUrl('pptx')],
      cover_image_url: generateImageUrl(['poster', 'education', theme.toLowerCase(), 'classroom']),
      preview_images: generatePreviewImages(['poster', 'education', theme.toLowerCase()]),
      status: 'published',
      published_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      views_count: Math.floor(Math.random() * 400) + 15,
      sales_count: Math.floor(Math.random() * 40),
      avg_rating: Math.random() * 1 + 4.0
    })
    productIndex++
    console.log(`  ✓ Created: ${title}`)
  }

  // Tarpaulins (5 products)
  console.log('\nCreating Tarpaulins (5 products)...')
  const tarpaulinSeasons = ['Christmas', 'Summer', 'Back to School', 'Graduation', 'Opening Ceremony']
  const tarpaulinOccasions = ['Graduation', 'Birthday', 'Opening Ceremony', 'Recognition Day', 'Foundation Day']
  const tarpaulinSizes = ['3x5 feet', '4x6 feet', '5x8 feet', '3x4 feet', '4x8 feet']
  for (let i = 0; i < 5; i++) {
    const seller = getRandomSeller()
    const season = i < 3 ? tarpaulinSeasons[i] : undefined
    const occasion = i >= 2 ? tarpaulinOccasions[i] : undefined
    const size = tarpaulinSizes[i]
    
    if (!seller.userId) continue

    const title = season 
      ? `Tarpaulin Design - ${season} (${size})`
      : `Tarpaulin Design - ${occasion} (${size})`

    products.push({
      seller_id: seller.userId,
      title,
      description: `Professional tarpaulin design for ${season || occasion} event. Size: ${size}. Ready to print and perfect for school events.`,
      slug: generateSlug(title),
      price: Math.floor(Math.random() * 300) + 100, // ₱100-₱400
      grade_id: grades[0].id,
      subject_id: subjects[0].id,
      product_type: 'Tarpaulins',
      specific_type: 'Event Tarpaulin',
      season,
      occasion,
      size,
      file_urls: [generateFileUrl('pdf'), generateFileUrl('pptx')],
      cover_image_url: generateImageUrl(['tarpaulin', 'banner', season?.toLowerCase() || occasion?.toLowerCase() || 'event']),
      preview_images: generatePreviewImages(['tarpaulin', 'banner', 'event']),
      status: 'published',
      published_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      views_count: Math.floor(Math.random() * 350) + 20,
      sales_count: Math.floor(Math.random() * 35),
      avg_rating: Math.random() * 1 + 4.0
    })
    productIndex++
    console.log(`  ✓ Created: ${title}`)
  }

  // Insert products into database
  console.log('\n💾 Inserting products into database...')
  let successCount = 0
  let failCount = 0

  for (const product of products) {
    try {
      const { error } = await supabase
        .from('products')
        .insert(product)

      if (error) {
        console.error(`  ❌ Failed to insert product "${product.title}": ${error.message}`)
        failCount++
      } else {
        successCount++
      }
    } catch (error) {
      console.error(`  ❌ Error inserting product: ${error instanceof Error ? error.message : 'Unknown error'}`)
      failCount++
    }
  }

  console.log(`\n✓ Products inserted: ${successCount} successful, ${failCount} failed`)
  return { successCount, failCount }
}

function generateCredentialsFile(sellers: SellerData[], outputPath: string) {
  console.log('\n📝 Generating credentials file...')

  let content = `# Sample Seller Credentials

> **Note:** These are test accounts created for development and testing purposes.
> All passwords are randomly generated. Please change passwords after first login if needed.

## Seller Accounts (20 total)

| # | Email | Password | Username | Name | Role | Subscription Tier |
|---|-------|----------|----------|------|------|-------------------|
`

  sellers.forEach((seller, index) => {
    const sellerFullName = seller.first_name && seller.last_name
      ? `${seller.first_name} ${seller.last_name}`.trim()
      : seller.first_name || seller.name || 'Seller'
    content += `| ${index + 1} | ${seller.email} | \`${seller.password}\` | ${seller.username} | ${sellerFullName} | seller | ${seller.subscription_tier} |\n`
  })

  content += `
## Usage Instructions

1. Use these credentials to log in to the application
2. All sellers have \`can_sell = true\` and \`is_verified_teacher = true\`
3. Products are already created and published for these sellers
4. Subscription tiers are distributed as follows:
   - Free: Basic features
   - Pro: Advanced analytics and features
   - Pioneer: Custom commission rates and premium features

## Security Note

⚠️ **Important:** These are test credentials. Do not use these accounts in production.
Change all passwords before deploying to production.

---
*Generated on ${new Date().toLocaleString()}*
`

  writeFileSync(outputPath, content, 'utf-8')
  console.log(`✓ Credentials file created: ${outputPath}`)
}

async function main() {
  console.log('🚀 Starting sample data creation script...\n')

  const supabase = createAdminClient()

  try {
    // Step 1: Query grades and subjects
    const { grades, subjects, gradeSubjects } = await queryGradesAndSubjects(supabase)

    if (grades.length === 0 || subjects.length === 0) {
      throw new Error('No grades or subjects found in database. Please run migrations first.')
    }

    // Step 2: Create sellers
    console.log('\n👥 Creating 20 seller users...\n')
    const sellers: SellerData[] = []
    let successCount = 0
    let failCount = 0

    for (let i = 0; i < sellerTemplates.length; i++) {
      const seller = await createSeller(supabase, sellerTemplates[i], i)
      if (seller) {
        sellers.push(seller)
        successCount++
      } else {
        failCount++
      }
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 200))
    }

    console.log(`\n✓ Sellers created: ${successCount} successful, ${failCount} failed`)

    if (sellers.length === 0) {
      throw new Error('No sellers were created. Cannot proceed with product creation.')
    }

    // Step 3: Create products
    const productResults = await createProducts(supabase, sellers, grades, subjects, gradeSubjects)

    // Step 4: Generate credentials file
    const credentialsPath = join(process.cwd(), 'docs', 'sample-seller-credentials.md')
    generateCredentialsFile(sellers, credentialsPath)

    // Summary
    console.log('\n' + '='.repeat(60))
    console.log('✅ SAMPLE DATA CREATION COMPLETE')
    console.log('='.repeat(60))
    console.log(`\n📊 Summary:`)
    console.log(`   • Sellers created: ${successCount}/${sellerTemplates.length}`)
    console.log(`   • Products created: ${productResults.successCount}/30`)
    console.log(`   • Credentials file: docs/sample-seller-credentials.md`)
    console.log(`\n🎉 All done! You can now use the seller accounts to test the application.`)
    console.log('='.repeat(60) + '\n')

  } catch (error) {
    console.error('\n❌ Script failed:', error instanceof Error ? error.message : 'Unknown error')
    if (error instanceof Error && error.stack) {
      console.error('\nStack trace:', error.stack)
    }
    process.exit(1)
  }
}

// Run the script
main()
  .then(() => {
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Unhandled error:', error)
    process.exit(1)
  })
