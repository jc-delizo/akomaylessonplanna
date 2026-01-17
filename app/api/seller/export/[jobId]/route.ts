import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { jobId } = await params
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get export job
    const { data: exportJob, error } = await supabase
      .from('export_jobs')
      .select('*')
      .eq('id', jobId)
      .eq('user_id', user.id)
      .single()

    if (error || !exportJob) {
      return NextResponse.json({ error: 'Export job not found' }, { status: 404 })
    }

    return NextResponse.json({
      job_id: exportJob.id,
      status: exportJob.status,
      file_url: exportJob.file_url,
      error_message: exportJob.error_message,
      created_at: exportJob.created_at,
      completed_at: exportJob.completed_at,
    })
  } catch (error) {
    console.error('Error in GET /api/seller/export/:jobId:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
