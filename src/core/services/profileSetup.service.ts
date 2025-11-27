// core/services/profileSetup.service.ts

import axios, { AxiosError } from "axios";
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ChildProfile } from '../../types/child.types';
import { getAuthToken } from './authStorage';

// Base URL - Update this with your actual API base URL
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://api.staging.kaizen.emerj.net';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ======================================================
// Interceptors
// ======================================================

api.interceptors.request.use(
  async (config) => {
    console.log('🚀 ProfileSetup API Request Starting...');
    console.log('📍 URL:', (config.baseURL || '') + (config.url || ''));
    console.log('🔧 Method:', config.method?.toUpperCase());
    
    const token = await getAuthToken();
    console.log('🔑 Token:', token ? `${token.substring(0, 20)}...` : 'NO TOKEN');

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      console.error('❌ No auth token found in storage!');
    }

    console.log('📦 Request Body:', JSON.stringify(config.data, null, 2));
    
    return config;
  },
  (error) => {
    console.error('❌ Request Interceptor Error:', error);
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    console.log('✅ ProfileSetup API Response Success');
    console.log('📊 Status:', response.status);
    console.log('📦 Response Data:', JSON.stringify(response.data, null, 2));
    return response;
  },
  (error) => {
    console.error('❌ ProfileSetup API Response Error');
    if (error.response) {
      console.error('📊 Status:', error.response.status);
      console.error('📦 Error Data:', JSON.stringify(error.response.data, null, 2));
    }
    return Promise.reject(error);
  }
);

// ======================================================
// Types
// ======================================================

export interface CreateProfileSetupRequest {
  mom_status: string;
  goals: string[];
  partner: {
    name: string;
    email: string;
  } | null;
  children: any[];
}

export interface ProfileSetupData {
  id: string;
  user_id: string;
  mom_status: string;
  goals: string[];
  partner: {
    name: string;
    email: string;
  } | null;
  children: ChildProfile[];
  created_at?: string;
  updated_at?: string;
}

interface ProfileSetupResponse {
  status: string;
  status_code: number;
  message: string;
  data: ProfileSetupData;
}

// ======================================================
// CREATE PROFILE SETUP  (UPDATED TO SUPPORT STRING RESPONSE)
// ======================================================

export async function createProfileSetup(
  data: CreateProfileSetupRequest
): Promise<ProfileSetupData | { id: string }> {
  try {
    console.log('🟢 Creating profile setup...');
    console.log('📤 Request data:', JSON.stringify(data, null, 2));

    const response = await api.post('/api/v1/profile-setup/', data);

    console.log('📦 Raw Response:', JSON.stringify(response.data, null, 2));

    // API RETURNS A RAW STRING -> THE PROFILE SETUP ID
    let profileSetupId: string;

    if (typeof response.data === "string") {
      profileSetupId = response.data;
    } else if (response.data?.data?.id) {
      // fallback for object-based API response
      profileSetupId = response.data.data.id;
    } else {
      console.error("❌ Unknown response format:", response.data);
      throw new Error("Unexpected profile setup response format");
    }

    console.log("🔑 profile_setup_id:", profileSetupId);

    // Store ID for later use
    await AsyncStorage.setItem("profile_setup_id", profileSetupId);
    console.log("✅ Stored profile_setup_id in AsyncStorage");

    // Return minimal object to avoid breaking child logic
    return { id: profileSetupId };

  } catch (error) {
    const axiosError = error as AxiosError<any>;

    console.error('❌ Error creating profile setup');
    console.error('Status:', axiosError.response?.status);
    console.error('Message:', axiosError.response?.data?.message);
    console.error('Errors:', axiosError.response?.data?.errors);
    console.error('Detail:', axiosError.response?.data?.detail);

    if (axiosError.response?.status === 422) {
      const detail = axiosError.response.data.detail;
      if (Array.isArray(detail)) {
        const errorMessages = detail
          .map((err: any) => `${err.loc.join('.')}: ${err.msg}`)
          .join(', ');
        throw new Error(`Validation failed: ${errorMessages}`);
      }
      throw new Error(`Validation failed`);
    }

    if (axiosError.response?.status === 409) {
      throw new Error("Profile setup already exists");
    }

    if (axiosError.response?.status === 401) {
      throw new Error("Unauthorized - please log in again");
    }

    throw new Error("Failed to create profile setup");
  }
}

// ======================================================
// FETCH PROFILE SETUP
// ======================================================

export async function getProfileSetup(): Promise<ProfileSetupData | null> {
  try {
    console.log('🔵 Fetching profile setup...');
    
    const response = await api.get<ProfileSetupResponse>('/api/v1/profile-setup/');
    
    console.log('📦 Profile setup response:', JSON.stringify(response.data, null, 2));
    
    const profileSetup = response.data.data;

    if (profileSetup?.id) {
      await AsyncStorage.setItem('profile_setup_id', profileSetup.id);
      console.log('✅ Stored profile_setup_id in AsyncStorage');
      return profileSetup;
    }

    console.warn('⚠️ Profile setup data incomplete');
    return null;

  } catch (error) {
    const axiosError = error as AxiosError;

    if (axiosError.response?.status === 404) {
      console.error('❌ Profile setup not found');
    } else if (axiosError.response?.status === 401) {
      console.error('❌ Unauthorized');
    } else {
      console.error('❌ Error fetching profile setup:', error);
    }

    return null;
  }
}

// ======================================================
// GET profile_setup_id (Storage → API fallback)
// ======================================================

export async function getProfileSetupId(): Promise<string | null> {
  console.log('🔍 Getting profile_setup_id...');

  try {
    const storedId = await AsyncStorage.getItem('profile_setup_id');

    if (storedId) {
      console.log('✅ Found profile_setup_id in AsyncStorage:', storedId);
      return storedId;
    }
  } catch (error) {
    console.error('❌ Error reading AsyncStorage:', error);
  }

  console.log('⚠️ Not in storage → Fetching from API...');
  const profileSetup = await getProfileSetup();

  if (profileSetup?.id) return profileSetup.id;

  console.error('❌ Could not retrieve profile_setup_id');
  return null;
}
