export const QUEUES = {
  notifications: 'notifications',
  imports: 'imports',
  maintenance: 'maintenance',
} as const;

export interface NotificationJob {
  userIds: number[];
  kind: string;
  title: string;
  body?: string;
  data?: Record<string, any>;
  channels?: ('in_app' | 'push' | 'sms')[];
}

export interface ImportJobData {
  importJobId: number;
  filePath: string;
}

export const MAINTENANCE_JOBS = {
  expireReservations: 'expire-reservations',
  cancelUnpaid: 'cancel-unpaid',
  expireOffers: 'expire-offers',
  syncShipments: 'sync-shipments',
} as const;
