import { createClient } from '@supabase/supabase-js';
import { createAuthStorageProxy } from '@/lib/authStorage';

// Supabase 프로젝트 정보 (환경 변수에서 가져오기)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
        persistSession: true,
        autoRefreshToken: true,
        storage: createAuthStorageProxy(),
    },
});

// 타입 정의
export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[];

export interface Database {
    public: {
        Tables: {
            academies: {
                Row: {
                    id: string;
                    name: string;
                    owner_email: string;
                    plan: string;
                    student_limit: number;
                    /** 학원 기본 월 회비(원) */
                    default_monthly_fee: number | null;
                    created_at: string | null;
                };
                Insert: Omit<Database['public']['Tables']['academies']['Row'], 'id' | 'created_at'>;
                Update: Partial<Database['public']['Tables']['academies']['Insert']>;
                Relationships: [];
            };
            users: {
                Row: {
                    id: string;
                    academy_id: string;
                    role: 'admin' | 'student';
                    name: string;
                    email: string | null;
                    phone: string | null;
                    created_at: string | null;
                };
                Insert: Omit<Database['public']['Tables']['users']['Row'], 'id' | 'created_at'>;
                Update: Partial<Database['public']['Tables']['users']['Insert']>;
                Relationships: [];
            };
            students: {
                Row: {
                    id: string;
                    academy_id: string;
                    name: string;
                    parent_id: string | null;
                    user_id: string | null;
                    enrollment_date: string;
                    /** 퇴원일. NULL이면 재학 중 */
                    left_academy_date: string | null;
                    /** 월 회비(원). NULL이면 자동 청구 시 직전 금액·기본값 */
                    monthly_fee: number | null;
                    active: boolean;
                    profile_image: string | null;
                    /** 보호자 연락처(전화번호 문자열) */
                    parent_phone: string | null;
                    /** NULL이면 보호자 전화(숫자만) 뒤 8자리로 매칭 */
                    attendance_pin: string | null;
                    grade: string | null;
                    memo: string | null;
                    progress_memo: string | null;
                    /** 배정 커리큘럼 트랙 (NULL이면 기본 트랙 또는 학원 전체 순서) */
                    curriculum_track_id: string | null;
                    created_at: string | null;
                };
                Insert: Omit<
                    Database['public']['Tables']['students']['Row'],
                    'id' | 'user_id' | 'attendance_pin' | 'created_at'
                > & {
                    user_id?: string | null;
                    attendance_pin?: string | null;
                    curriculum_track_id?: string | null;
                };
                Update: Partial<Database['public']['Tables']['students']['Insert']>;
                Relationships: [];
            };
            attendance: {
                Row: {
                    id: string;
                    student_id: string;
                    type: 'check_in' | 'check_out';
                    timestamp: string | null;
                    phone_last_digits: string;
                };
                Insert: Omit<Database['public']['Tables']['attendance']['Row'], 'id' | 'timestamp'>;
                Update: Partial<Database['public']['Tables']['attendance']['Insert']>;
                Relationships: [];
            };
            curriculum: {
                Row: {
                    id: string;
                    academy_id: string;
                    title: string;
                    level: string | null;
                    order: number;
                    is_event: boolean;
                    textbook_id: string | null;
                    /** 교재 내 단계 번호 (교재마다 1부터) */
                    textbook_step: number | null;
                    created_at: string | null;
                };
                Insert: Omit<
                    Database['public']['Tables']['curriculum']['Row'],
                    'id' | 'created_at' | 'level' | 'textbook_id' | 'textbook_step'
                > & { level?: string | null; textbook_id?: string | null; textbook_step?: number | null };
                Update: Partial<Database['public']['Tables']['curriculum']['Insert']>;
                Relationships: [];
            };
            student_progress: {
                Row: {
                    id: string;
                    student_id: string;
                    curriculum_id: string;
                    started_at: string | null;
                    completed_at: string | null;
                    status: 'in_progress' | 'completed';
                    notes: string | null;
                };
                Insert: Omit<Database['public']['Tables']['student_progress']['Row'], 'id' | 'notes'> & {
                    notes?: string | null;
                };
                Update: Partial<Database['public']['Tables']['student_progress']['Insert']>;
                Relationships: [];
            };
            student_curriculum_path: {
                Row: {
                    id: string;
                    student_id: string;
                    curriculum_id: string;
                    sort_order: number;
                    created_at: string | null;
                };
                Insert: Omit<Database['public']['Tables']['student_curriculum_path']['Row'], 'id' | 'created_at'>;
                Update: Partial<Database['public']['Tables']['student_curriculum_path']['Insert']>;
                Relationships: [];
            };
            curriculum_tracks: {
                Row: {
                    id: string;
                    academy_id: string;
                    name: string;
                    sort_order: number;
                    is_default: boolean;
                    created_at: string | null;
                };
                Insert: Omit<Database['public']['Tables']['curriculum_tracks']['Row'], 'id' | 'created_at'>;
                Update: Partial<Database['public']['Tables']['curriculum_tracks']['Insert']>;
                Relationships: [];
            };
            curriculum_track_steps: {
                Row: {
                    id: string;
                    track_id: string;
                    curriculum_id: string;
                    sort_order: number;
                    created_at: string | null;
                };
                Insert: Omit<Database['public']['Tables']['curriculum_track_steps']['Row'], 'id' | 'created_at'>;
                Update: Partial<Database['public']['Tables']['curriculum_track_steps']['Insert']>;
                Relationships: [];
            };
            media: {
                Row: {
                    id: string;
                    student_id: string;
                    curriculum_id: string | null;
                    youtube_url: string;
                    thumbnail: string | null;
                    title: string | null;
                    uploaded_at: string | null;
                };
                Insert: Omit<
                    Database['public']['Tables']['media']['Row'],
                    'id' | 'uploaded_at' | 'curriculum_id' | 'thumbnail' | 'title'
                > & {
                    curriculum_id?: string | null;
                    thumbnail?: string | null;
                    title?: string | null;
                };
                Update: Partial<Database['public']['Tables']['media']['Insert']>;
                Relationships: [
                    {
                        foreignKeyName: 'media_student_id_fkey',
                        columns: ['student_id'],
                        isOneToOne: false,
                        referencedRelation: 'students',
                        referencedColumns: ['id'],
                    },
                ];
            };
            consultations: {
                Row: {
                    id: string;
                    student_id: string;
                    teacher_id: string;
                    content: string;
                    date: string;
                    created_at: string | null;
                };
                Insert: Omit<Database['public']['Tables']['consultations']['Row'], 'id' | 'created_at'>;
                Update: Partial<Database['public']['Tables']['consultations']['Insert']>;
                Relationships: [];
            };
            payments: {
                Row: {
                    id: string;
                    student_id: string;
                    amount: number;
                    due_date: string;
                    paid_date: string | null;
                    status: 'pending' | 'paid' | 'overdue';
                    billing_month: string;
                    notes: string | null;
                    created_at: string | null;
                };
                Insert: Omit<
                    Database['public']['Tables']['payments']['Row'],
                    'id' | 'billing_month' | 'created_at' | 'notes'
                > & {
                    billing_month?: string;
                    notes?: string | null;
                };
                Update: Partial<Database['public']['Tables']['payments']['Insert']>;
                Relationships: [
                    {
                        foreignKeyName: 'payments_student_id_fkey',
                        columns: ['student_id'],
                        isOneToOne: false,
                        referencedRelation: 'students',
                        referencedColumns: ['id'],
                    },
                ];
            };
            textbooks: {
                Row: {
                    id: string;
                    academy_id: string;
                    name: string;
                    price: number;
                    /** 학원 내 교재 나열 순서 (0부터) */
                    sort_order: number;
                    created_at: string | null;
                };
                Insert: Omit<Database['public']['Tables']['textbooks']['Row'], 'id' | 'created_at' | 'sort_order'> & {
                    sort_order?: number;
                };
                Update: Partial<Database['public']['Tables']['textbooks']['Insert']>;
                Relationships: [];
            };
            student_textbooks: {
                Row: {
                    id: string;
                    student_id: string;
                    textbook_id: string;
                    paid: boolean;
                    paid_at: string | null;
                    created_at: string | null;
                };
                Insert: Omit<Database['public']['Tables']['student_textbooks']['Row'], 'id' | 'created_at'>;
                Update: Partial<Database['public']['Tables']['student_textbooks']['Insert']>;
                Relationships: [];
            };
            wish_songs: {
                Row: {
                    id: string;
                    student_id: string;
                    title: string;
                    requested_at: string | null;
                    status: 'pending' | 'approved' | 'rejected';
                    approved_by: string | null;
                    response_notes: string | null;
                };
                Insert: Omit<
                    Database['public']['Tables']['wish_songs']['Row'],
                    'id' | 'requested_at' | 'approved_by' | 'response_notes'
                > & {
                    approved_by?: string | null;
                    response_notes?: string | null;
                };
                Update: Partial<Database['public']['Tables']['wish_songs']['Insert']>;
                Relationships: [];
            };
            instructors: {
                Row: {
                    id: string;
                    academy_id: string;
                    name: string;
                    phone: string;
                    role: string;
                    major: string;
                    status: string;
                    sort_order: number;
                    active: boolean;
                    created_at: string;
                };
                Insert: Omit<Database['public']['Tables']['instructors']['Row'], 'id' | 'created_at'>;
                Update: Partial<Database['public']['Tables']['instructors']['Insert']>;
                Relationships: [];
            };
            scheduled_lessons: {
                Row: {
                    id: string;
                    academy_id: string;
                    instructor_id: string;
                    student_id: string | null;
                    title: string;
                    notes: string | null;
                    start_at: string;
                    end_at: string;
                    created_at: string;
                };
                Insert: Omit<Database['public']['Tables']['scheduled_lessons']['Row'], 'id' | 'created_at'>;
                Update: Partial<Database['public']['Tables']['scheduled_lessons']['Insert']>;
                Relationships: [];
            };
            platform_admins: {
                Row: {
                    user_id: string;
                    created_at: string;
                };
                Insert: Omit<Database['public']['Tables']['platform_admins']['Row'], 'created_at'>;
                Update: Partial<Database['public']['Tables']['platform_admins']['Insert']>;
                Relationships: [];
            };
        };
        Views: Record<string, never>;
        Functions: {
            count_active_students_with_unpaid_textbooks: {
                Args: { p_academy_id: string };
                Returns: number;
            };
            academy_exists: {
                Args: { p_id: string };
                Returns: boolean;
            };
            signup_admin_bootstrap: {
                Args: { p_display_name: string; p_academy_name: string };
                Returns: string;
            };
        };
    };
}
