import { supabase } from './supabase';

export interface UserData {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: string; // Assume this is a string like "admin", "staff", etc.
  fullName: string;
}

export async function handleAddUser(data: UserData): Promise<{ success: string; error: string }> {
  const { username, email, password, confirmPassword, role, fullName } = data;

  if (!username || !email || !password || !confirmPassword || !role || !fullName) {
    return { error: 'All fields are required.', success: '' };
  }

  if (password !== confirmPassword) {
    return { error: 'Passwords do not match.', success: '' };
  }

  // 🔍 Check if username already exists in profiles
  const { data: existingUser, error: usernameCheckError } = await supabase
    .from('profiles')
    .select('username')
    .eq('username', username)
    .single();

  if (usernameCheckError && usernameCheckError.code !== 'PGRST116') {
    return { error: `Failed to validate username: ${usernameCheckError.message}`, success: '' };
  }

  if (existingUser) {
    return { error: 'Username already exists. Please choose another.', success: '' };
  }

  // ✅ Sign up the user with Supabase Auth
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
  });

  if (signUpError || !signUpData.user) {
    return { error: signUpError?.message || 'Sign-up failed.', success: '' };
  }

  const userId = signUpData.user.id;

  // 🔍 Fetch role_id from roles table
  const { data: roleData, error: roleError } = await supabase
    .from('roles')
    .select('role_id')
    .eq('role_name', role) // assuming role names are stored in a 'name' column
    .single();

  if (roleError || !roleData) {
    return { error: `Invalid role specified: '${role}'.`, success: '' };

  }

  const roleId = roleData.role_id;

  // 🧾 Insert into profiles table
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

  return {
    success: 'User profile created successfully!',
    error: '',
  };
}
