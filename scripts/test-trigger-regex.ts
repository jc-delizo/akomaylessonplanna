/**
 * Test trigger regex matching
 */

const testContent = `CREATE TRIGGER trigger_update_announcements_updated_at
  BEFORE UPDATE ON announcements
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();`

const triggerRegex = /CREATE TRIGGER\s+(\w+)\s+ON\s+(\w+)\s+([\s\S]*?)\s+EXECUTE\s+FUNCTION\s+([\w_]+)\(\);/gi

const match = triggerRegex.exec(testContent)
if (match) {
  console.log('Match found!')
  console.log('Trigger name:', match[1])
  console.log('Table name:', match[2])
  console.log('Options:', match[3])
  console.log('Function:', match[4])
} else {
  console.log('No match found')
  console.log('Content:', testContent)
}
