import { supabase } from './supabase';

export interface UserData {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: string;
  fullName: string;
}

export async function handleAddUser(
  data: UserData
): Promise<{ success: string; error: string }> {
  const { username, email, password, confirmPassword, role, fullName } = data;

  if (!username || !email || !password || !confirmPassword || !role || !fullName) {
    return { error: 'All fields are required.', success: '' };
  }

  if (password !== confirmPassword) {
    return { error: 'Passwords do not match.', success: '' };
  }

  // 1. Get current logged-in user (actor)
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session?.user?.email) {
    return { error: 'Unable to identify current user.', success: '' };
  }

  const actorEmail = session.user.email;

  // 2. Fetch actor's username from profiles
  const { data: actorData, error: actorFetchError } = await supabase
    .from('profiles')
    .select('username')
    .eq('email', actorEmail)
    .single();

  if (actorFetchError || !actorData?.username) {
    return { error: 'Could not resolve actor username from session.', success: '' };
  }

  const actorUsername = actorData.username;

  // 3. Check if the username to be created already exists
  const { data: existingUser, error: usernameCheckError } = await supabase
    .from('profiles')
    .select('username')
    .eq('username', username)
    .single();

  if (usernameCheckError && usernameCheckError.code !== 'PGRST116') {
    return {
      error: `Failed to validate username: ${usernameCheckError.message}`,
      success: '',
    };
  }

  if (existingUser) {
    return { error: 'Username already exists. Please choose another.', success: '' };
  }

  // 4. Sign up the new user
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
  });

  if (signUpError || !signUpData.user) {
    return { error: signUpError?.message || 'Sign-up failed.', success: '' };
  }

  const userId = signUpData.user.id;

  // 5. Fetch role_id from roles table
  const { data: roleData, error: roleFetchError } = await supabase
    .from('roles')
    .select('role_id')
    .eq('role_name', role)
    .single();

  if (roleFetchError || !roleData) {
    return {
      error: `Invalid role specified: '${role}'.`,
      success: '',
    };
  }

  const roleId = roleData.role_id;

  // 6. Insert into profiles table
  const { error: profileInsertError } = await supabase.from('profiles').insert({
    id: userId,
    username,
    role_id: roleId,
    full_name: fullName,
    email,
  });

  if (profileInsertError) {
    return { error: `Profile creation failed: ${profileInsertError.message}`, success: '' };
  }

  // 7. Manually log the insert action into audit_log
  const { error: auditLogError } = await supabase.from('audit_log').insert([
    {
      table_name: 'profiles',
      record_id: userId,
      action_type: 'insert',
      username: actorUsername,
    },
  ]);

  if (auditLogError) {
    return { error: `Audit log insert failed: ${auditLogError.message}`, success: '' };
  }

  return {
    success: 'User profile created successfully!',
    error: '',
  };
}
