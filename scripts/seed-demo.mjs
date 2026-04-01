/**
 * supabase/pianote.sql 데모 구간과 동일한 데이터를 Supabase에 삽입합니다 (JS upsert).
 * SUPABASE_SERVICE_ROLE_KEY 필요 (anon 불가).
 *
 * npm run seed:demo
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

if (!url || !serviceKey) {
    console.error(
        'VITE_SUPABASE_URL와 SUPABASE_SERVICE_ROLE_KEY가 .env에 필요합니다.'
    )
    process.exit(1)
}

const supabase = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
})

const A1 = '11111111-1111-1111-1111-111111111111'
const A2 = '22222222-2222-2222-2222-222222222222'

async function run () {
    const { error: e1 } = await supabase.from('academies').upsert(
        [
            {
                id: A1,
                name: 'PiaNote',
                owner_email: 'csi515@nate.com',
            },
            {
                id: A2,
                name: '피아노트 데모 분당점',
                owner_email: 'demo.owner@bundang.pianote.local',
            },
        ],
        { onConflict: 'id' }
    )
    if (e1) throw e1
    console.log('academies OK')

    const { error: e2 } = await supabase.from('curriculum').upsert(
        [
            {
                id: '33333333-3333-3333-3333-333333333333',
                academy_id: A1,
                title: '하농 1권',
                level: '입문',
                order: 1,
                is_event: false,
            },
            {
                id: '44444444-4444-4444-4444-444444444444',
                academy_id: A1,
                title: '하농 2권',
                level: '초급',
                order: 2,
                is_event: false,
            },
            {
                id: '55555555-5555-5555-5555-555555555555',
                academy_id: A1,
                title: '연주회 (발표)',
                level: null,
                order: 10,
                is_event: true,
            },
            {
                id: '66666666-6666-6666-6666-666666666666',
                academy_id: A2,
                title: '바이엘 상',
                level: '입문',
                order: 1,
                is_event: false,
            },
        ],
        { onConflict: 'id' }
    )
    if (e2) throw e2
    console.log('curriculum OK')

    const { error: e3 } = await supabase.from('instructors').upsert(
        [
            {
                id: '77777777-7777-7777-7777-777777777777',
                academy_id: A1,
                name: '김데모',
                phone: '010-1111-2222',
                role: '전임강사',
                major: '클래식',
                status: '재직',
                sort_order: 0,
                active: true,
            },
            {
                id: '88888888-8888-8888-8888-888888888888',
                academy_id: A1,
                name: '이샘플',
                phone: '010-3333-4444',
                role: '파트타임',
                major: '재즈',
                status: '재직',
                sort_order: 1,
                active: true,
            },
        ],
        { onConflict: 'id' }
    )
    if (e3) throw e3
    console.log('instructors OK')

    const { error: e4 } = await supabase.from('students').upsert(
        [
            {
                id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
                academy_id: A1,
                name: '학생 민지',
                parent_id: null,
                enrollment_date: new Date(Date.now() - 120 * 86400000).toISOString().slice(0, 10),
                active: true,
                user_id: null,
            },
            {
                id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
                academy_id: A1,
                name: '학생 서준',
                parent_id: null,
                enrollment_date: new Date(Date.now() - 60 * 86400000).toISOString().slice(0, 10),
                active: true,
                user_id: null,
            },
            {
                id: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
                academy_id: A2,
                name: '학생 하은',
                parent_id: null,
                enrollment_date: new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10),
                active: true,
                user_id: null,
            },
        ],
        { onConflict: 'id' }
    )
    if (e4) throw e4
    console.log('students OK')

    const { error: e5 } = await supabase.from('student_progress').upsert(
        [
            {
                id: 'dddddddd-dddd-dddd-dddd-dddddddddddd',
                student_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
                curriculum_id: '33333333-3333-3333-3333-333333333333',
                status: 'completed',
                notes: null,
            },
            {
                id: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
                student_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
                curriculum_id: '44444444-4444-4444-4444-444444444444',
                status: 'in_progress',
                notes: '2곡 연습 중',
            },
            {
                id: 'ffffffff-ffff-ffff-ffff-ffffffffffff',
                student_id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
                curriculum_id: '33333333-3333-3333-3333-333333333333',
                status: 'in_progress',
                notes: null,
            },
        ],
        { onConflict: 'id' }
    )
    if (e5) throw e5
    console.log('student_progress OK')

    const today = new Date()
    const d7 = new Date(today)
    d7.setDate(d7.getDate() + 7)
    const d3ago = new Date(today)
    d3ago.setDate(d3ago.getDate() - 3)
    const d1ago = new Date(today)
    d1ago.setDate(d1ago.getDate() - 1)

    const { error: e6 } = await supabase.from('payments').upsert(
        [
            {
                id: '12121212-1212-1212-1212-121212121212',
                student_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
                amount: 120000,
                due_date: d7.toISOString().slice(0, 10),
                paid_date: null,
                status: 'pending',
                notes: '데모 청구',
            },
            {
                id: '13131313-1313-1313-1313-131313131313',
                student_id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
                amount: 120000,
                due_date: d3ago.toISOString().slice(0, 10),
                paid_date: d1ago.toISOString().slice(0, 10),
                status: 'paid',
                notes: null,
            },
        ],
        { onConflict: 'id' }
    )
    if (e6) throw e6
    console.log('payments OK')

    const yesterday = new Date(Date.now() - 86400000).toISOString()
    const yesterdayPlus50 = new Date(Date.now() - 86400000 + 50 * 60000).toISOString()

    const { error: e8 } = await supabase.from('attendance').upsert(
        [
            {
                id: '16161616-1616-1616-1616-161616161616',
                student_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
                type: 'check_in',
                timestamp: yesterday,
                phone_last_digits: '12345678',
            },
            {
                id: '17171717-1717-1717-1717-171717171717',
                student_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
                type: 'check_out',
                timestamp: yesterdayPlus50,
                phone_last_digits: '12345678',
            },
        ],
        { onConflict: 'id' }
    )
    if (e8) throw e8
    console.log('attendance OK')

    const startAt = new Date(Date.now() + 86400000)
    const endAt = new Date(startAt.getTime() + 50 * 60000)

    const { error: e9 } = await supabase.from('scheduled_lessons').upsert(
        [
            {
                id: '18181818-1818-1818-1818-181818181818',
                academy_id: A1,
                instructor_id: '77777777-7777-7777-7777-777777777777',
                student_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
                title: '개인 레슨 (민지)',
                notes: null,
                start_at: startAt.toISOString(),
                end_at: endAt.toISOString(),
            },
        ],
        { onConflict: 'id' }
    )
    if (e9) throw e9
    console.log('scheduled_lessons OK')

    const { error: e10 } = await supabase.from('media').upsert(
        [
            {
                id: '19191919-1919-1919-1919-191919191919',
                student_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
                curriculum_id: '33333333-3333-3333-3333-333333333333',
                youtube_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                thumbnail: null,
                title: '데모 연주 영상',
            },
        ],
        { onConflict: 'id' }
    )
    if (e10) throw e10
    console.log('media OK')

    console.log('\n데모 데이터 삽입 완료.')
}

run().catch((err) => {
    console.error(err)
    process.exit(1)
})
