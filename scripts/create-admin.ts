import { config } from 'dotenv'
import { resolve } from 'path'
import { createAdminClient } from '../lib/supabase/admin'

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') })

/**
 * Script to create a system admin account
 * Usage: npx tsx scripts/create-admin.ts <email> [name] [password]
 * 
 * If password is not provided, a temporary password will be generated
 * and the user will need to reset it on first login.
 */

async function createAdminAccount(email: string, name?: string, password?: string) {
  const supabase = createAdminClient()

  console.log(`Creating admin account for: ${email}`)

  // Generate a secure random password if not provided
  const tempPassword = password || generateTempPassword()

  try {
    // Step 1: Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true, // Auto-confirm email for admin
      user_metadata: {
        name: name || email.split('@')[0],
        role: 'admin',
      },
    })

    if (authError) {
      console.error('Error creating auth user:', authError)
      throw authError
    }

    if (!authData.user) {
      throw new Error('Failed to create auth user')
    }

    console.log(`✓ Auth user created: ${authData.user.id}`)

    // Step 2: Wait a moment for the trigger to create the profile, then update it
    // The handle_new_user() trigger will automatically create a basic profile
    await new Promise(resolve => setTimeout(resolve, 500))

    // Step 3: Update the user profile with admin details
    const username = name 
      ? name.toLowerCase().replace(/\s+/g, '_').substring(0, 20)
      : email.split('@')[0].substring(0, 20)

    const { error: profileError } = await supabase
      .from('users')
      .update({
        email: email,
        name: name || email.split('@')[0],
        username: username,
        role: 'admin',
        is_verified_teacher: false,
        can_sell: false,
        email_verified: true,
        email_verified_at: new Date().toISOString(),
      })
      .eq('id', authData.user.id)

    if (profileError) {
      // If profile update fails, check if profile exists, if not create it manually
      const { data: existingProfile } = await supabase
        .from('users')
        .select('id')
        .eq('id', authData.user.id)
        .single()

      if (!existingProfile) {
        // Profile doesn't exist, create it manually
        const { error: insertError } = await supabase
          .from('users')
          .insert({
            id: authData.user.id,
            email: email,
            name: name || email.split('@')[0],
            username: username,
            role: 'admin',
            is_verified_teacher: false,
            can_sell: false,
            email_verified: true,
            email_verified_at: new Date().toISOString(),
          })

        if (insertError) {
          console.error('Error creating user profile:', insertError)
          await supabase.auth.admin.deleteUser(authData.user.id)
          throw insertError
        }
      } else {
        // Profile exists but update failed, try again
        console.error('Error updating user profile:', profileError)
        throw profileError
      }
    }

    console.log(`✓ User profile created in database`)

    // Step 3: Output success message
    console.log('\n✅ Admin account created successfully!')
    console.log('\nAccount Details:')
    console.log(`  Email: ${email}`)
    console.log(`  Name: ${name || email.split('@')[0]}`)
    console.log(`  Username: ${username}`)
    console.log(`  Role: admin`)
    console.log(`  Email Verified: true`)
    
    if (!password) {
      console.log(`\n⚠️  Temporary Password: ${tempPassword}`)
      console.log('⚠️  Please change this password on first login!')
    } else {
      console.log(`\n✓ Password set (as provided)`)
    }

    console.log('\nThe admin can now log in at the login page.')

  } catch (error) {
    console.error('\n❌ Failed to create admin account:', error)
    process.exit(1)
  }
}

function generateTempPassword(): string {
  // Generate a secure random password
  const length = 16
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*'
  let password = ''
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length))
  }
  return password
}

// Parse command line arguments
const args = process.argv.slice(2)

if (args.length === 0) {
  console.error('Usage: npx tsx scripts/create-admin.ts <email> [name] [password]')
  console.error('Example: npx tsx scripts/create-admin.ts admin@example.com "Admin User"')
  process.exit(1)
}

const email = args[0]
const name = args[1]
const password = args[2]

// Validate email
if (!email || !email.includes('@')) {
  console.error('Error: Invalid email address')
  process.exit(1)
}

// Run the script
createAdminAccount(email, name, password)
  .then(() => {
    console.log('\n✓ Script completed successfully')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error)
    process.exit(1)
  })
