import { projectId } from '/utils/supabase/info';

/**
 * Base URL for all DuoReel server API calls.
 * Centralised here so the function slug only ever needs changing in one place.
 */
export const API_BASE_URL =
  `https://${projectId}.supabase.co/functions/v1/make-server-5623fde1`;
