import { supabase } from '@/lib/supabase';
import type { Database } from '@/lib/supabase';
import type { ActiveStudentSummary } from '@/services/students.service';

type PaymentRow = Database['public']['Tables']['payments']['Row'];
type PaymentInsert = Database['public']['Tables']['payments']['Insert'];
type PaymentUpdate = Database['public']['Tables']['payments']['Update'];

export type PaymentWithStudent = PaymentRow & { student_name: string };

/** input type="month" 값 (YYYY-MM) → billing_month 저장용 (해당 월 1일) */
export function toBillingMonthStart (yyyyMm: string): string {
    const [y, m] = yyyyMm.split('-').map(Number);
    if (!y || !m) return new Date().toISOString().slice(0, 10);
    return `${y}-${String(m).padStart(2, '0')}-01`;
}

/** 로컬 날짜 기준 YYYY-MM (toISOString은 UTC라 타임존에서 월이 어긋남) */
export function formatMonthInput (d: Date): string {
    const y = d.getFullYear();
    const mo = d.getMonth() + 1;
    return `${y}-${String(mo).padStart(2, '0')}`;
}

export function shiftMonth (yyyyMm: string, delta: number): string {
    const [y, m] = yyyyMm.split('-').map(Number);
    if (!Number.isFinite(y) || !Number.isFinite(m)) {
        return formatMonthInput(new Date());
    }
    const d = new Date(y, m - 1 + delta, 1);
    return formatMonthInput(d);
}

export function lastDayOfMonthYYYYMm (yyyyMm: string): string {
    const [y, m] = yyyyMm.split('-').map(Number);
    const d = new Date(y, m, 0);
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}-${mm}-${dd}`;
}

/**
 * 월별 청구 화면에 학생을 표시할지: 가입일이 그 청구 월 말일 이하여야 함(그 달부터 대상).
 * 가입일이 없는 행은 기존 DB 호환으로 포함.
 */
export function isEnrollmentOnOrBeforeBillingMonth (
    enrollmentDate: string | null | undefined,
    billingMonthYYYYMm: string
): boolean {
    if (!enrollmentDate?.trim()) return true;
    return enrollmentDate <= lastDayOfMonthYYYYMm(billingMonthYYYYMm);
}

/**
 * 월별 청구 목록에 학생을 넣을지: 가입·퇴원 규칙을 함께 적용.
 * 퇴원일이 있으면 청구 월 1일 이전에 이미 퇴원했으면 제외(퇴원일 ≥ 청구 월 1일인 달만 표시).
 */
export function isStudentInMonthlyPaymentsList (
    enrollmentDate: string | null | undefined,
    leftAcademyDate: string | null | undefined,
    billingMonthYYYYMm: string
): boolean {
    if (!isEnrollmentOnOrBeforeBillingMonth(enrollmentDate, billingMonthYYYYMm)) return false;
    if (!leftAcademyDate?.trim()) return true;
    const firstDay = toBillingMonthStart(billingMonthYYYYMm);
    return leftAcademyDate >= firstDay;
}

/** YYYY-MM → "2026년 3월" (브라우저 로캘 영어 월 표기 대체용) */
export function formatBillingMonthLabelKo(yyyyMm: string): string {
    const [ys, ms] = yyyyMm.split('-');
    const y = Number(ys);
    const mo = Number(ms);
    if (!Number.isFinite(y) || !Number.isFinite(mo) || mo < 1 || mo > 12) {
        return yyyyMm;
    }
    return `${y}년 ${mo}월`;
}

export function parseYearMonth(yyyyMm: string): { year: number; month: number } {
    const [ys, ms] = yyyyMm.split('-');
    const y = Number(ys);
    const mo = Number(ms);
    const now = new Date();
    const year =
        Number.isFinite(y) && y >= 1900 && y <= 2100 ? y : now.getFullYear();
    const month =
        Number.isFinite(mo) && mo >= 1 && mo <= 12 ? mo : now.getMonth() + 1;
    return { year, month };
}

/** 학생 가입일의 일자를 매월 반영한 납부 예정일(해당 달 말일 초과 시 말일로 보정) */
export function dueDateForBillingMonthFromEnrollment (
    enrollmentDate: string,
    billingMonthYYYYMm: string
): string {
    const dayRaw = parseInt(enrollmentDate.slice(8, 10), 10);
    const day = Number.isFinite(dayRaw) && dayRaw >= 1 && dayRaw <= 31 ? dayRaw : 1;
    const [ys, ms] = billingMonthYYYYMm.split('-');
    const y = Number(ys);
    const mo = Number(ms);
    if (!Number.isFinite(y) || !Number.isFinite(mo) || mo < 1 || mo > 12) {
        return enrollmentDate.slice(0, 10);
    }
    const lastDay = new Date(y, mo, 0).getDate();
    const d = Math.min(day, lastDay);
    return `${y}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

/**
 * 청구 월의 납부 예정일. `monthlyDueDay`가 NULL이면 가입일 일자와 동일 로직.
 * 값이 있으면 해당 일(1–31)을 그 달에 맞추고 말일로 클램프.
 */
export function dueDateForBillingMonth (
    billingMonthYYYYMm: string,
    enrollmentDate: string,
    monthlyDueDay: number | null
): string {
    if (monthlyDueDay == null) {
        return dueDateForBillingMonthFromEnrollment(enrollmentDate, billingMonthYYYYMm);
    }
    const dayRaw = monthlyDueDay;
    const day =
        Number.isFinite(dayRaw) && dayRaw >= 1 && dayRaw <= 31 ? Math.floor(Number(dayRaw)) : 1;
    const [ys, ms] = billingMonthYYYYMm.split('-');
    const y = Number(ys);
    const mo = Number(ms);
    if (!Number.isFinite(y) || !Number.isFinite(mo) || mo < 1 || mo > 12) {
        return enrollmentDate.slice(0, 10);
    }
    const lastDay = new Date(y, mo, 0).getDate();
    const d = Math.min(day, lastDay);
    return `${y}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

/** `billing_month`(해당 월 1일) 기준으로 납부 예정일 입력 허용 구간 */
export function isoDateRangeForBillingMonthStart (
    billingMonthStart: string | null
): { min: string; max: string } | null {
    if (!billingMonthStart?.trim()) return null;
    const d = billingMonthStart.slice(0, 10);
    const [ys, ms] = d.split('-');
    const y = Number(ys);
    const mo = Number(ms);
    if (!Number.isFinite(y) || !Number.isFinite(mo) || mo < 1 || mo > 12) return null;
    const lastDay = new Date(y, mo, 0).getDate();
    const min = `${y}-${String(mo).padStart(2, '0')}-01`;
    const max = `${y}-${String(mo).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
    return { min, max };
}

/** `YYYY-MM-DD` → 일(1–31). 학생 `monthly_due_day` 저장용 */
export function dayOfMonthFromIsoDate (isoDateYmd: string): number | null {
    if (!isoDateYmd || isoDateYmd.length < 10) return null;
    const d = parseInt(isoDateYmd.slice(8, 10), 10);
    if (!Number.isFinite(d) || d < 1 || d > 31) return null;
    return d;
}

/** 월 회비·직전 청구가 없을 때 자동 생성 금액(원) */
export const FALLBACK_MONTHLY_FEE_AMOUNT = 100000;

async function fetchAcademyDefaultMonthlyFee (academyId: string): Promise<number | null> {
    try {
        const { data, error } = await supabase
            .from('academies')
            .select('default_monthly_fee')
            .eq('id', academyId)
            .maybeSingle();
        if (error) throw error;
        const v = (data as { default_monthly_fee?: number | null } | null)?.default_monthly_fee ?? null;
        return typeof v === 'number' && Number.isFinite(v) && v > 0 ? Math.round(v) : null;
    } catch (e) {
        console.error('fetchAcademyDefaultMonthlyFee:', e);
        return null;
    }
}

/** 학생별 가장 최근 청구 금액(같은 billing_month 기준 내림차순 첫 건) */
export async function fetchLatestPaymentAmountByStudentIds (
    studentIds: string[]
): Promise<Map<string, number>> {
    const out = new Map<string, number>();
    if (studentIds.length === 0) return out;
    try {
        const { data, error } = await supabase
            .from('payments')
            .select('student_id, amount, billing_month')
            .in('student_id', studentIds);

        if (error) throw error;
        const rows = [...(data || [])].sort((a, b) =>
            String(b.billing_month).localeCompare(String(a.billing_month))
        );
        for (const row of rows) {
            const sid = row.student_id as string;
            if (!out.has(sid)) {
                out.set(sid, row.amount as number);
            }
        }
    } catch (e) {
        console.error('fetchLatestPaymentAmountByStudentIds:', e);
    }
    return out;
}

/** 청구 월 선택용 연도 목록 (선택 연도가 범위 밖이면 포함) */
export function buildBillingYearOptions(selectedYear: number): number[] {
    const cy = new Date().getFullYear();
    const lo = Math.min(cy - 4, selectedYear);
    const hi = Math.max(cy + 4, selectedYear);
    const out: number[] = [];
    for (let y = lo; y <= hi; y++) {
        out.push(y);
    }
    return out;
}

/**
 * 해당 학원 소속 학생의 `payments` 행 중, 납부 예정일 경과·미납인 **건수(件)**.
 * 월 회비·수동 청구 등 모든 결제 행 포함. 대시보드 「연체 결제」타일·상단 종과 동일.
 * (교재비 `student_textbooks` 미납과는 별개 — `docs/TERMINOLOGY.md` 참고.)
 */
export const countOverduePaymentsByAcademy = async (academyId: string): Promise<number> => {
    try {
        const { data: studs, error: se } = await supabase
            .from('students')
            .select('id')
            .eq('academy_id', academyId);

        if (se || !studs?.length) return 0;

        const ids = studs.map((s) => s.id);
        const today = new Date().toISOString().slice(0, 10);
        const { count, error } = await supabase
            .from('payments')
            .select('*', { count: 'exact', head: true })
            .in('student_id', ids)
            .lt('due_date', today)
            .is('paid_date', null);

        if (error) {
            console.error('countOverduePaymentsByAcademy:', error);
            return 0;
        }
        return count ?? 0;
    } catch (e) {
        console.error('countOverduePaymentsByAcademy:', e);
        return 0;
    }
};

export const listPaymentsByAcademy = async (
    academyId: string
): Promise<PaymentWithStudent[]> => {
    try {
        const { data: studs, error: se } = await supabase
            .from('students')
            .select('id, name')
            .eq('academy_id', academyId);

        if (se) throw se;
        const list = studs || [];
        if (list.length === 0) return [];

        const idSet = new Set(list.map((s) => s.id));
        const nameById = new Map(list.map((s) => [s.id, s.name]));

        const { data: pays, error: pe } = await supabase
            .from('payments')
            .select('*')
            .in('student_id', [...idSet])
            .order('due_date', { ascending: false });

        if (pe) throw pe;

        return (pays || []).map((p) => ({
            ...p,
            student_name: nameById.get(p.student_id) ?? '—',
        }));
    } catch (e) {
        console.error('listPaymentsByAcademy:', e);
        return [];
    }
};

export type PaymentsPageResult = {
    rows: PaymentWithStudent[];
    total: number;
};

export type ListPaymentsByAcademyPageOptions = {
    /** true면 납부 완료(`status === paid`) 행만. false면 미납·연체 포함 — 결제 관리 「전체 내역」탭에서 비활성 학생 청구까지 볼 때 사용 */
    paidOnly?: boolean;
};

/** 결제 관리 「전체 내역」: 청구 월(`billing_month`)이 이번 달 이하인 행만 (미래 월 청구 제외) */
function billingMonthThroughCurrentInclusive (): string {
    return toBillingMonthStart(formatMonthInput(new Date()));
}

/** 학원 소속 결제 전체 내역 페이지 (학생 조인으로 academy 필터 + range) */
export const listPaymentsByAcademyPage = async (
    academyId: string,
    page: number,
    pageSize: number,
    options?: ListPaymentsByAcademyPageOptions
): Promise<PaymentsPageResult> => {
    const from = page * pageSize;
    const to = from + pageSize - 1;
    try {
        let q = supabase
            .from('payments')
            .select(
                `
                *,
                students!inner (
                    name,
                    academy_id
                )
            `,
                { count: 'exact' }
            )
            .eq('students.academy_id', academyId)
            .lte('billing_month', billingMonthThroughCurrentInclusive());

        if (options?.paidOnly) {
            q = q.eq('status', 'paid');
            q = q.order('paid_date', { ascending: false }).order('due_date', { ascending: false });
        } else {
            q = q.order('due_date', { ascending: false });
        }

        const { data, error, count } = await q.range(from, to);

        if (error) throw error;

        type Row = PaymentRow & {
            students: { name: string; academy_id: string };
        };

        const rows = (data || []) as Row[];
        return {
            rows: rows.map((p) => {
                const { students: st, ...rest } = p;
                return {
                    ...(rest as PaymentRow),
                    student_name: st?.name ?? '—',
                };
            }),
            total: count ?? 0,
        };
    } catch (e) {
        console.error('listPaymentsByAcademyPage:', e);
        return { rows: [], total: 0 };
    }
};

export const listPaymentsForBillingMonth = async (
    academyId: string,
    billingMonthStart: string
): Promise<PaymentWithStudent[]> => {
    try {
        const { data: studs, error: se } = await supabase
            .from('students')
            .select('id, name')
            .eq('academy_id', academyId);

        if (se) throw se;
        const list = studs || [];
        if (list.length === 0) return [];

        const nameById = new Map(list.map((s) => [s.id, s.name]));
        const ids = list.map((s) => s.id);

        const { data: pays, error: pe } = await supabase
            .from('payments')
            .select('*')
            .in('student_id', ids)
            .eq('billing_month', billingMonthStart)
            .order('student_id', { ascending: true });

        if (pe) throw pe;

        return (pays || []).map((p) => ({
            ...p,
            student_name: nameById.get(p.student_id) ?? '—',
        }));
    } catch (e) {
        console.error('listPaymentsForBillingMonth:', e);
        return [];
    }
};

export const createPayment = async (
    row: PaymentInsert
): Promise<{ success: boolean; error?: string; row?: PaymentRow }> => {
    try {
        const { data, error } = await supabase
            .from('payments')
            .insert(row)
            .select()
            .single();

        if (error) throw error;
        return { success: true, row: data };
    } catch (e) {
        console.error('createPayment:', e);
        return {
            success: false,
            error: e instanceof Error ? e.message : '등록 실패',
        };
    }
};

/**
 * 해당 청구 월에 결제 행이 없는 학생에게 자동 등록(납부 예정일 = 학생 `monthly_due_day` 또는 가입일 일자).
 * 금액: 학생 monthly_fee → 직전 청구 금액 → FALLBACK_MONTHLY_FEE_AMOUNT
 */
export async function ensureMonthlyPaymentsForBillingMonth (
    billingMonthYYYYMm: string,
    academyId: string,
    students: ActiveStudentSummary[]
): Promise<{ created: number }> {
    if (students.length === 0) return { created: 0 };
    const billingStart = toBillingMonthStart(billingMonthYYYYMm);
    const studentIds = students.map((s) => s.id);

    try {
        const { data: existing, error: exErr } = await supabase
            .from('payments')
            .select('student_id')
            .eq('billing_month', billingStart)
            .in('student_id', studentIds);

        if (exErr) throw exErr;
        const existingSet = new Set((existing ?? []).map((p) => p.student_id as string));
        const missing = students.filter((s) => !existingSet.has(s.id));
        if (missing.length === 0) return { created: 0 };

        const latestAmounts = await fetchLatestPaymentAmountByStudentIds(studentIds);
        const academyDefault = await fetchAcademyDefaultMonthlyFee(academyId);
        let created = 0;

        for (const s of missing) {
            const dueDate = dueDateForBillingMonth(
                billingMonthYYYYMm,
                s.enrollment_date,
                s.monthly_due_day ?? null
            );
            const amount =
                s.monthly_fee ??
                latestAmounts.get(s.id) ??
                academyDefault ??
                FALLBACK_MONTHLY_FEE_AMOUNT;

            const res = await createPayment({
                student_id: s.id,
                amount: Math.round(amount),
                due_date: dueDate,
                billing_month: billingStart,
                paid_date: null,
                status: 'pending',
            });
            if (res.success) created += 1;
        }
        return { created };
    } catch (e) {
        console.error('ensureMonthlyPaymentsForBillingMonth:', e);
        return { created: 0 };
    }
}

export const updatePayment = async (
    id: string,
    updates: PaymentUpdate
): Promise<{ success: boolean; error?: string }> => {
    try {
        const { error } = await supabase.from('payments').update(updates).eq('id', id);

        if (error) throw error;
        return { success: true };
    } catch (e) {
        console.error('updatePayment:', e);
        return {
            success: false,
            error: e instanceof Error ? e.message : '수정 실패',
        };
    }
};

export const deletePayment = async (id: string): Promise<{ success: boolean; error?: string }> => {
    try {
        const { error } = await supabase.from('payments').delete().eq('id', id);
        if (error) throw error;
        return { success: true };
    } catch (e) {
        console.error('deletePayment:', e);
        return {
            success: false,
            error: e instanceof Error ? e.message : '삭제 실패',
        };
    }
};
