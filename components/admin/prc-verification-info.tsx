'use client'

import { Info, ExternalLink } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/registry/default/dialog/dialog'

export function PrcVerificationInfo() {
  return (
    <Dialog>
      <DialogTrigger
        className={cn(
          buttonVariants({ variant: 'ghost', size: 'icon' }),
          'h-8 w-8 text-gray-500 hover:text-blue-600 hover:bg-blue-50'
        )}
        title="How to verify PRC license"
      >
        <Info className="h-4 w-4" />
        <span className="sr-only">PRC verification instructions</span>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Info className="h-5 w-5 text-blue-600" />
            How to Verify PRC License
          </DialogTitle>
          <DialogDescription>
            Follow these steps to verify a teacher's PRC license number using the official PRC online verification system.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Step-by-step instructions */}
          <div className="space-y-4">
            <h3 className="font-semibold text-base">Step-by-Step Instructions</h3>
            <ol className="space-y-3 list-decimal list-inside">
              <li className="space-y-1">
                <span className="font-medium">Go to the PRC online verification page</span>
                <div className="ml-6 mt-1">
                  <a
                    href="https://verification.prc.gov.ph/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 hover:underline"
                  >
                    https://verification.prc.gov.ph/
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </li>
              <li className="space-y-1">
                <span className="font-medium">Choose "Licensed Professional"</span>
                <p className="ml-6 text-sm text-gray-600">
                  Select the tab for verifying licensed professionals (not examination ratings).
                </p>
              </li>
              <li className="space-y-1">
                <span className="font-medium">Select the profession:</span>
                <ul className="ml-6 mt-1 list-disc list-inside text-sm text-gray-600">
                  <li>Professional Teacher</li>
                  <li>Secondary Teacher</li>
                  <li className="text-gray-500">(depending on the license type)</li>
                </ul>
              </li>
              <li className="space-y-1">
                <span className="font-medium">Enter either:</span>
                <ul className="ml-6 mt-1 list-disc list-inside text-sm text-gray-600">
                  <li>License number, or</li>
                  <li>Full name (last name, first name)</li>
                </ul>
              </li>
              <li>
                <span className="font-medium">Submit</span>
                <p className="ml-6 text-sm text-gray-600">Click the verify button to check the license.</p>
              </li>
            </ol>
          </div>

          {/* What to verify */}
          <div className="space-y-3 p-4 bg-green-50 border border-green-200 rounded-lg">
            <h3 className="font-semibold text-base text-green-900">What to Look For (Valid License)</h3>
            <p className="text-sm text-green-800">
              If the license is valid, you should see the following information:
            </p>
            <ul className="space-y-1 ml-4 list-disc text-sm text-green-800">
              <li>Full name of the teacher</li>
              <li>License number</li>
              <li>Profession</li>
              <li>License status (Active, Inactive, Expired, Suspended, etc.)</li>
              <li>Validity dates</li>
            </ul>
          </div>

          {/* Troubleshooting */}
          <div className="space-y-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h3 className="font-semibold text-base text-yellow-900">Troubleshooting</h3>
            <p className="text-sm text-yellow-800">
              If nothing shows up, the license may be:
            </p>
            <ul className="space-y-1 ml-4 list-disc text-sm text-yellow-800">
              <li>Invalid</li>
              <li>Entered incorrectly</li>
              <li>Expired / not yet released</li>
              <li>Not a PRC-issued license</li>
            </ul>
            <p className="text-sm text-yellow-800 mt-2">
              In these cases, you should reject the verification request and ask the user to resubmit with correct information.
            </p>
          </div>

          {/* External link button */}
          <div className="pt-2">
            <a
              href="https://verification.prc.gov.ph/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <span>Open PRC Verification Site</span>
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
