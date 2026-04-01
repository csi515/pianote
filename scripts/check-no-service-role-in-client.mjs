/**
 * src/, public/ 에서 서비스 롤·위험 env 패턴이 없는지 검사 (CI용).
 * 종료 코드 1 = 금지 패턴 발견.
 */
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs'
import { join, extname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const root = join(__dirname, '..')

const EXT = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.css', '.html', '.svg'])
const FORBIDDEN = [
    /SUPABASE_SERVICE_ROLE/i,
    /SERVICE_ROLE_KEY\s*=/i,
    /VITE_[A-Z0-9_]*SERVICE_ROLE/i,
]

function walk (dir, files = []) {
    for (const name of readdirSync(dir)) {
        if (name === 'node_modules' || name === 'dist') continue
        const p = join(dir, name)
        const st = statSync(p)
        if (st.isDirectory()) walk(p, files)
        else if (EXT.has(extname(name))) files.push(p)
    }
    return files
}

const dirs = [join(root, 'src')]
if (existsSync(join(root, 'public'))) dirs.push(join(root, 'public'))

let bad = []
for (const file of dirs.flatMap((d) => walk(d))) {
    let txt
    try {
        txt = readFileSync(file, 'utf8')
    } catch {
        continue
    }
    const lines = txt.split(/\r?\n/)
    lines.forEach((line, i) => {
        for (const re of FORBIDDEN) {
            if (re.test(line) && !/check-no-service-role-in-client/.test(file)) {
                bad.push({ file, line: i + 1, lineText: line.trim().slice(0, 120) })
            }
        }
    })
}

if (bad.length) {
    console.error('Forbidden secret/env pattern in client paths:')
    for (const b of bad) {
        console.error(`  ${b.file}:${b.line} ${b.lineText}`)
    }
    process.exit(1)
}

console.log('check-no-service-role-in-client: OK')
