/**
 * 관리자 계정을 Supabase Auth + public.users에 등록/갱신합니다.
 * 서비스 롤 키가 필요합니다(anon 키로는 불가).
 *
 * 사용: 프로젝트 루트 .env 또는 .env.local에 다음을 넣은 뒤
 *   npm run seed:admin
 *
 * SUPABASE_SERVICE_ROLE_KEY=... (Dashboard → Settings → API → service_role)
 * SEED_ADMIN_PASSWORD=...       (선택, 기본 123456)
 *
 * 선택: SEED_ADMIN_EMAIL (기본 csi515@nate.com — pianote.sql 초기 학원 owner와 동일)
 * 선택: SEED_ACADEMY_ID (기본 데모 강남점 UUID, pianote.sql과 동일)
 */
import { createClient } from '@supabase/supabase-js'
import { readFileSync, existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')

function loadEnvFile (name, override = false) {
    const p = path.join(root, name)
    if (!existsSync(p)) return
    let txt = readFileSync(p, 'utf8')
    if (txt.charCodeAt(0) === 0xfeff) txt = txt.slice(1)
    for (const line of txt.split(/\r?\n/)) {
        const trimmed = line.trim()
        if (!trimmed || trimmed.startsWith('#')) continue
        const eq = trimmed.indexOf('=')
        if (eq === -1) continue
        const key = trimmed.slice(0, eq).trim()
        let val = trimmed.slice(eq + 1).trim()
        if (
            (val.startsWith('"') && val.endsWith('"')) ||
            (val.startsWith("'") && val.endsWith("'"))
        ) {
            val = val.slice(1, -1)
        }
        if (override || process.env[key] === undefined) {
            process.env[key] = val
        }
    }
}

loadEnvFile('.env')
loadEnvFile('.env.local', true)

const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_ROLE ||
    process.env.SUPABASE_SERVICE_KEY ||
    process.env.SERVICE_ROLE_KEY
const email = process.env.SEED_ADMIN_EMAIL ?? 'csi515@nate.com'
const password = process.env.SEED_ADMIN_PASSWORD ?? '123456'
const academyId =
    process.env.SEED_ACADEMY_ID ?? '11111111-1111-1111-1111-111111111111'

if (!url || !serviceKey) {
    console.error(
        'VITE_SUPABASE_URL(또는 SUPABASE_URL)와 SUPABASE_SERVICE_ROLE_KEY가 필요합니다.'
    )
    const hasNamedServiceRole = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY)
    const hasAnon = Boolean(process.env.VITE_SUPABASE_ANON_KEY)
    console.error(
        '(현재) URL:',
        url ? 'OK' : '없음',
        '| service role:',
        serviceKey ? 'OK' : '없음',
        '| SUPABASE_SERVICE_ROLE_KEY 이름으로 설정됨:',
        hasNamedServiceRole ? '예' : '아니오',
        '| anon 키(VITE_SUPABASE_ANON_KEY)는 있음:',
        hasAnon ? '예' : '아니오'
    )
    if (!hasNamedServiceRole && hasAnon) {
        console.error(
            '→ anon 키와 service_role secret은 서로 다릅니다. Dashboard → API에서 "service_role" 라벨의 긴 키를 SUPABASE_SERVICE_ROLE_KEY= 로 넣으세요.'
        )
    }
    process.exit(1)
}
const supabase = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
})

async function ensureAcademy () {
    const { data } = await supabase.from('academies').select('id').eq('id', academyId).maybeSingle()
    if (data) return
    const { error } = await supabase.from('academies').insert({
        id: academyId,
        name: 'PiaNote',
        owner_email: email,
    })
    if (error) throw error
}

async function findAuthUserByEmail (targetEmail) {
    let page = 1
    const perPage = 200
    for (;;) {
        const { data, error } = await supabase.auth.admin.listUsers({ page, perPage })
        if (error) throw error
        const found = data.users.find((u) => u.email?.toLowerCase() === targetEmail.toLowerCase())
        if (found) return found
        if (data.users.length < perPage) return null
        page += 1
    }
}

async function main () {
    await ensureAcademy()

    let userId
    const existing = await findAuthUserByEmail(email)

    if (existing) {
        const { data, error } = await supabase.auth.admin.updateUserById(existing.id, {
            password,
            email_confirm: true,
        })
        if (error) throw error
        userId = data.user.id
        console.log('기존 Auth 사용자 비밀번호를 갱신했습니다:', email)
    } else {
        const { data, error } = await supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
        })
        if (error) throw error
        if (!data.user) throw new Error('createUser: user 없음')
        userId = data.user.id
        console.log('Auth 사용자를 생성했습니다:', email)
    }

    const { error: upError } = await supabase.from('users').upsert(
        {
            id: userId,
            academy_id: academyId,
            role: 'admin',
            name: '원장',
            email,
            phone: '',
        },
        { onConflict: 'id' }
    )

    if (upError) throw upError
    console.log('public.users에 관리자(admin) 프로필을 반영했습니다. academy_id:', academyId)
}

main().catch((e) => {
    console.error(e)
    process.exit(1)
})
