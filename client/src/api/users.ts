import type { UserProfile } from '@/types';
import { apiClient } from './client';

export const usersApi = {
  /** Round-trips the access token through the API to confirm it is accepted. */
  me: () => apiClient.get<UserProfile>('/users/me'),
};
