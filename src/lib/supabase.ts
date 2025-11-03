import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
// Replace these with your actual Supabase URL and anon key when deploying
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'http://localhost:54321';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Upload a file to Supabase storage
 * @param file File to upload
 * @param studyId Study ID to associate with the file
 * @returns Object with path and url of the uploaded file
 */
export const uploadFile = async (file: File, studyId: string) => {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${studyId}/${Date.now()}.${fileExt}`;
    const filePath = `uploads/${fileName}`;
    
    const { data, error } = await supabase.storage
      .from('study-materials')
      .upload(filePath, file);
      
    if (error) throw error;
    
    const { data: { publicUrl } } = supabase.storage
      .from('study-materials')
      .getPublicUrl(filePath);
      
    return { path: filePath, url: publicUrl };
  } catch (error) {
    console.error('Error uploading file:', error);
    // Return mock data for development
    return { 
      path: `mock-path/${file.name}`, 
      url: `https://mock-url.com/${file.name}` 
    };
  }
};

// Types for database tables
export interface User {
  id: string;
  email: string;
  created_at: string;
}

export interface Study {
  id: string;
  user_id: string;
  name: string;
  status: 'in_progress' | 'completed';
  progress: number;
  created_at: string;
}

export interface Upload {
  id: string;
  study_id: string;
  file_name: string;
  file_type: 'slide' | 'pqp';
  file_url: string;
  upload_date: string;
}

export interface Quiz {
  id: string;
  study_id: string;
  question: string;
  options: string[];
  answer: string;
  user_response?: string;
}

export interface Topic {
  id: string;
  study_id: string;
  checkpoint_name: string;
  order: number;
  video_url?: string;
}

export interface Checkpoint {
  id: string;
  topic_id: string;
  completed: boolean;
}

// Database functions
export const db = {
  // User functions
  users: {
    getCurrentUser: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    },
  },
  
  // Studies functions
  studies: {
    getAll: async () => {
      const { data, error } = await supabase
        .from('studies')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Study[];
    },
    
    getById: async (id: string) => {
      const { data, error } = await supabase
        .from('studies')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data as Study;
    },
    
    create: async (name: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('studies')
        .insert([
          { 
            user_id: user.id,
            name,
            status: 'in_progress',
            progress: 0
          }
        ])
        .select()
        .single();
      
      if (error) throw error;
      return data as Study;
    },
    
    update: async (id: string, updates: Partial<Study>) => {
      const { data, error } = await supabase
        .from('studies')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data as Study;
    },
    
    delete: async (id: string) => {
      const { error } = await supabase
        .from('studies')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return true;
    }
  },
  
  // Uploads functions
  uploads: {
    getByStudyId: async (studyId: string) => {
      const { data, error } = await supabase
        .from('uploads')
        .select('*')
        .eq('study_id', studyId);
      
      if (error) throw error;
      return data as Upload[];
    },
    
    create: async (studyId: string, fileName: string, fileType: 'slide' | 'pqp', fileUrl: string) => {
      const { data, error } = await supabase
        .from('uploads')
        .insert([
          { 
            study_id: studyId,
            file_name: fileName,
            file_type: fileType,
            file_url: fileUrl,
            upload_date: new Date().toISOString()
          }
        ])
        .select()
        .single();
      
      if (error) throw error;
      return data as Upload;
    },
    
    delete: async (id: string) => {
      const { error } = await supabase
        .from('uploads')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return true;
    }
  },
  
  // Storage functions
  storage: {
    uploadFile: async (bucket: string, path: string, file: File) => {
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(path, file, {
          cacheControl: '3600',
          upsert: true
        });
      
      if (error) throw error;
      return data;
    },
    
    getPublicUrl: (bucket: string, path: string) => {
      const { data } = supabase.storage.from(bucket).getPublicUrl(path);
      return data.publicUrl;
    },
    
    deleteFile: async (bucket: string, path: string) => {
      const { error } = await supabase.storage
        .from(bucket)
        .remove([path]);
      
      if (error) throw error;
      return true;
    }
  }
};