import { supabase } from '@/lib/supabase';

export async function handleComponentSubmit(data: {
  part_number: string;
  part_name: string;
  description: string;
  status: string;
  version_number: string;
  cost: string;
  file: File | null;
}) {
  console.log('🚀 Starting component submission with data:', data);

  const {
    part_number,
    part_name,
    description,
    status,
    version_number,
    cost,
    file,
  } = data;

  // Get current user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    console.error('❌ User auth failed:', userError?.message);
    throw new Error('User not authenticated');
  }

  const userEmail = user.email;
  if (!userEmail) {
    console.error('❌ Email not found in user object:', user);
    throw new Error('Email not found');
  }

  // Get username from profiles table
  const { data: profileData, error: profileError } = await supabase
    .from('profiles')
    .select('username')
    .eq('email', userEmail)
    .single();

  if (profileError || !profileData?.username) {
    console.error('❌ Failed to fetch username from profiles:', profileError?.message);
    throw new Error('Failed to retrieve username from profiles');
  }

  const username = profileData.username;
  console.log('✅ Username fetched from profiles:', username);

  let filePath: string | null = null;

  // Upload file if present
  if (file) {
    const storagePath = `${part_number}/${version_number}.pdf`;
    console.log(`📤 Uploading file to path: ${storagePath}`);

    const { error: uploadError } = await supabase.storage
      .from('drawings')
      .upload(storagePath, file, {
        cacheControl: '3600',
        upsert: true,
        contentType: 'application/pdf',
      });

    if (uploadError) {
      console.error('❌ File upload failed:', uploadError.message);
      throw new Error('Failed to upload PDF');
    }

    filePath = storagePath;
    console.log('✅ File uploaded successfully:', filePath);
  }

  // Upsert component
  const { error: componentError } = await supabase
    .from('components')
    .upsert(
      {
        part_number,
        part_name,
        description,
        status,
      },
      { onConflict: 'part_number' }
    );

  if (componentError) {
    console.error('❌ Component insert/upsert failed:', componentError.message);
    throw new Error('Failed to insert component');
  }

  console.log('✅ Component upserted:', {
    part_number,
    part_name,
    description,
    status,
  });

  // Insert component version
  const { error: versionError } = await supabase.from('component_versions').insert({
    part_number,
    version_number,
    file_path: filePath,
    created_by: username,
    cost: cost ? parseFloat(cost) : null,
  });

  if (versionError) {
    console.error('❌ Component version insert failed:', versionError.message);
    throw new Error('Failed to insert component version');
  }

  console.log('✅ Component version inserted:', {
    part_number,
    version_number,
    file_path: filePath,
    created_by: username,
    cost: cost ? parseFloat(cost) : null,
  });

  console.log('🎉 Component submission completed successfully!');
  return { success: true };
}
