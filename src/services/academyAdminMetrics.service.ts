/**
 * 대시보드·상단바가 같은 학원에 대해 동시에 요청하는 지표를 한 번에 가져오고,
 * 짧은 TTL 캐시 + in-flight 병합으로 중복 Supabase 왕복을 줄인다.
 *
 * 지표 의미: `overduePaymentsCount` = 청구 연체 건(`payments`), `unpaidTextbookStudentsCount` = 교재비 미납 활성 학생 수.
 * (`docs/TERMINOLOGY.md`)
 */
import { supabase } from '@/lib/supabase';
import { countOverduePaymentsByAcademy } from '@/services/payments.service';
import { countStudentsWithUnpaidTextbookFees } from '@/services/textbooks.service';

export type AcademyAdminMetrics = {
    activeStudentCount: number;
    overduePaymentsCount: number;
    unpaidTextbookStudentsCount: number;
};

const TTL_MS = 5000;
const cache = new Map<string, { at: number; data: AcademyAdminMetrics }>();
const inflight = new Map<string, Promise<AcademyAdminMetrics>>();

async function fetchAcademyAdminMetricsUncached (academyId: string): Promise<AcademyAdminMetrics> {
    const [{ count: activeCt, error: activeErr }, overduePaymentsCount, unpaidTextbookStudentsCount] =
        await Promise.all([
            supabase
                .from('students')
                .select('*', { count: 'exact', head: true })
                .eq('academy_id', academyId)
                .eq('active', true),
            countOverduePaymentsByAcademy(academyId),
            countStudentsWithUnpaidTextbookFees(academyId),
        ]);

    if (activeErr) {
        console.error('getAcademyAdminMetrics active count:', activeErr);
    }

    return {
        activeStudentCount: activeErr ? 0 : activeCt ?? 0,
        overduePaymentsCount,
        unpaidTextbookStudentsCount,
    };
}

/**
 * 학원 관리자 상단·대시보드 공통 지표 (동일 academyId 동시 호출은 한 번의 네트워크 묶음만 수행).
 */
export async function getAcademyAdminMetrics (academyId: string): Promise<AcademyAdminMetrics> {
    const now = Date.now();
    const hit = cache.get(academyId);
    if (hit && now - hit.at < TTL_MS) {
        return hit.data;
    }

    const pending = inflight.get(academyId);
    if (pending) {
        return pending;
    }

    const p = fetchAcademyAdminMetricsUncached(academyId)
        .then((data) => {
            cache.set(academyId, { at: Date.now(), data });
            return data;
        })
        .finally(() => {
            inflight.delete(academyId);
        });

    inflight.set(academyId, p);
    return p;
}

/** 결제·학생·교재 변경 후 배지·대시보드가 최신이 되도록 캐시 무효화 */
export function invalidateAcademyAdminMetricsCache (academyId?: string): void {
    if (academyId) {
        cache.delete(academyId);
    } else {
        cache.clear();
    }
}
