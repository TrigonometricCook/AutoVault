import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export interface EditUserPayload {
  username: string;
  email: string;
  full_name: string;
  role: string;
  newPassword?: string; // Ignored in this case
}

export async function handleEditUser(userData: EditUserPayload) {
  try {
    // Get role_id from roles table
    const { data: roleData, error: roleError } = await supabase
      .from('roles')
      .select('role_id')
      .eq('role_name', userData.role)
      .single();

    if (roleError || !roleData) {
      return { error: 'Invalid role selected.' };
    }

    // Update only full_name and role_id (NOT email)
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        full_name: userData.full_name,
        role_id: roleData.role_id
      })
      .eq('username', userData.username);

    if (updateError) {
      return { error: 'Failed to update user in database.' };
    }

    return { success: 'User updated successfully.' };
  } catch (err) {
    console.error(err);
    return { error: 'Unexpected error occurred during update.' };
  }
}
