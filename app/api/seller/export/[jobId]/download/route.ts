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

    if (exportJob.status !== 'completed') {
      return NextResponse.json(
        { error: 'Export job not completed yet', status: exportJob.status },
        { status: 400 }
      )
    }

    if (!exportJob.file_url) {
      return NextResponse.json({ error: 'File URL not available' }, { status: 404 })
    }

    // If file_url is a data URL, decode it
    if (exportJob.file_url.startsWith('data:')) {
      const base64Data = exportJob.file_url.split(',')[1]
      const buffer = Buffer.from(base64Data, 'base64')
      const contentType = exportJob.format === 'csv' ? 'text/csv' : 'application/octet-stream'

      return new NextResponse(buffer, {
        headers: {
          'Content-Type': contentType,
          'Content-Disposition': `attachment; filename="export-${jobId}.${exportJob.format}"`,
        },
      })
    }

    // If file_url is a Supabase Storage URL, redirect to it
    return NextResponse.redirect(exportJob.file_url)
  } catch (error) {
    console.error('Error in GET /api/seller/export/:jobId/download:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
