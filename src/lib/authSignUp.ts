import { supabase } from '@/lib/supabase';
import { normalizePhoneDigits } from '@/lib/phone';
import { mapAuthError } from '@/lib/mapAuthError';

export async function signUpAdmin(
    email: string,
    password: string,
    name: string,
    phone: string,
    academyName: string
): Promise<{ error: Error | null }> {
    try {
        const phoneNorm = normalizePhoneDigits(phone);
        if (phoneNorm.length < 10) {
            throw new Error('휴대전화 번호 10자리 이상을 입력해주세요.');
        }

        const { error: authError } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    signup_role: 'admin',
                    display_name: name,
                    academy_name: academyName,
                    phone: phoneNorm,
                },
            },
        });

        if (authError) throw authError;

        return { error: null };
    } catch (error) {
        console.error('Sign up error:', error);
        return { error: mapAuthError(error) };
    }
}
