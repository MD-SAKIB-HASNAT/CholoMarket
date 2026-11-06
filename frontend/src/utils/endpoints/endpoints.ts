import { ADMIN_ENDPOINTS } from '@/utils/endpoints/admin.endpoints';
import { PORTAL_ENDPOINTS } from '@/utils/endpoints/portal.endpoints';
import { STORE_ENDPOINTS } from '@/utils/endpoints/store.endpoints';

/** Every API path the web app calls, by area. */
export const ENDPOINTS = {
  store: STORE_ENDPOINTS,
  admin: ADMIN_ENDPOINTS,
  portal: PORTAL_ENDPOINTS,
};

export { ADMIN_ENDPOINTS, PORTAL_ENDPOINTS, STORE_ENDPOINTS };
