import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getAdminUser } from '@/lib/utils/admin-auth'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

export default async function CreateAnnouncementPage() {
  const supabase = await createClient()
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  if (!authUser) {
    redirect('/login?redirect=/admin/announcements/create')
  }

  const adminUser = await getAdminUser(authUser.id)
  if (!adminUser) {
    redirect('/')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Create Announcement</h1>
        <p className="text-gray-600 mt-1">Send system-wide or targeted announcements</p>
      </div>

      <Card className="p-6">
        <form className="space-y-6">
          {/* Announcement Type */}
          <div>
            <Label htmlFor="type">Announcement Type</Label>
            <select
              name="type"
              id="type"
              defaultValue="platform_update"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="system_maintenance">System Maintenance</option>
              <option value="new_feature">New Feature</option>
              <option value="platform_update">Platform Update</option>
              <option value="promotion">Promotion</option>
              <option value="urgent_notice">Urgent Notice</option>
              <option value="educational">Educational</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Title */}
          <div>
            <Label htmlFor="title">Title (max 100 chars)</Label>
            <Input
              id="title"
              name="title"
              placeholder="Enter announcement title..."
              maxLength={100}
              required
            />
          </div>

          {/* Message */}
          <div>
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              name="message"
              placeholder="Enter announcement message (500 chars for in-app, 2000 for email)..."
              rows={6}
              maxLength={2000}
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Rich text editor will be implemented here
            </p>
          </div>

          {/* Target Audience */}
          <div>
            <Label htmlFor="audience">Target Audience</Label>
            <select
              name="audience"
              id="audience"
              defaultValue="all"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="all">All Users</option>
              <option value="buyers">Buyers Only</option>
              <option value="sellers">Sellers Only</option>
              <option value="verified_sellers">Verified Sellers</option>
              <option value="pro">Pro Subscribers</option>
              <option value="pioneer">Pioneers</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Advanced segmentation will be implemented here
            </p>
          </div>

          {/* Delivery Options */}
          <div className="space-y-2">
            <Label>Delivery</Label>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2">
                <input type="checkbox" name="delivery_in_app" defaultChecked />
                <span className="text-sm">In-App Notification</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" name="delivery_email" defaultChecked />
                <span className="text-sm">Email</span>
              </label>
            </div>
          </div>

          {/* Priority */}
          <div>
            <Label htmlFor="priority">Priority</Label>
            <select
              name="priority"
              id="priority"
              defaultValue="normal"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="normal">Normal</option>
              <option value="important">Important</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>

          {/* Scheduling */}
          <div className="space-y-2">
            <Label>Schedule</Label>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2">
                <input type="radio" name="schedule" value="immediate" defaultChecked />
                <span className="text-sm">Send Immediately</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="radio" name="schedule" value="later" />
                <span className="text-sm">Schedule for Later</span>
              </label>
            </div>
            <Input
              type="datetime-local"
              name="scheduled_for"
              className="mt-2"
              disabled
            />
            <p className="text-xs text-gray-500">Date/time picker will be implemented here</p>
          </div>

          {/* Display Duration */}
          <div>
            <Label htmlFor="duration">Display Duration</Label>
            <select
              name="duration"
              id="duration"
              defaultValue="7"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="1">1 Day</option>
              <option value="3">3 Days</option>
              <option value="7">7 Days</option>
              <option value="14">14 Days</option>
              <option value="30">30 Days</option>
              <option value="never">Never Expire</option>
            </select>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-4 border-t">
            <Button type="submit" className="flex-1">
              Create Announcement
            </Button>
            <Button type="button" variant="outline">
              Save as Draft
            </Button>
            <Button type="button" variant="outline">
              Save as Template
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
