import { supabase } from '@/lib/supabase';

export type ComponentWithLatestVersion = {
  part_number: string;
  part_name: string | null;
  description: string | null;
  status: string | null;
  version_number: string;
  file_path: string;
};

export async function fetchLatestComponents(): Promise<{
  data: ComponentWithLatestVersion[] | null;
  error: string | null;
}> {
  const { data, error } = await supabase
    .from('components_with_latest_version')
    .select('part_number, part_name, description, status, version_number, file_path');

  if (error) {
    console.error('Error fetching components:', error.message);
    return { data: null, error: error.message };
  }

  return { data, error: null };
}
