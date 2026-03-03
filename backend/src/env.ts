import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const backendRoot = path.resolve(__dirname, '..')

// Load backend/.env first, then let backend/.env.local override for local development.
dotenv.config({ path: path.join(backendRoot, '.env') })
dotenv.config({ path: path.join(backendRoot, '.env.local'), override: true })
