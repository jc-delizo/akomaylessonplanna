import { createHash } from 'node:crypto'

export function hashDeletionConfirmationCode(code: string): string {
  return createHash('sha256').update(code, 'utf8').digest('hex')
}
