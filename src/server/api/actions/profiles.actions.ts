'use server';

import { revalidateTag } from '@/lib/cache';
import { createWritableServerSupabaseClient } from '@/lib/supabase/server';
import { ActionResponse } from '@/lib/types/transport.types';

interface UpdateProfileParams {
  mainCurrency: string;
}

export async function updateProfile(params: UpdateProfileParams): Promise<ActionResponse> {
  const supabase = await createWritableServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase
    .from('profiles')
    .upsert({ id: user!.id, main_currency: params.mainCurrency });

  if (error) {
    return { success: false, error: { code: error.code, message: error.message } };
  }

  revalidateTag({ tag: 'profiles', userId: user!.id });
  return { success: true };
}
