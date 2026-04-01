/**
 * 단일 SQL 원본 확인 (supabase/pianote.sql)
 * 과거에는 여러 마이그레이션을 합쳤으나, 이제 pianote.sql 하나만 유지합니다.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const f = path.join(__dirname, '..', 'supabase', 'pianote.sql')

if (!fs.existsSync(f)) {
    console.error('Missing supabase/pianote.sql')
    process.exit(1)
}
const { size } = fs.statSync(f)
console.log('Canonical SQL:', f, size, 'bytes')
