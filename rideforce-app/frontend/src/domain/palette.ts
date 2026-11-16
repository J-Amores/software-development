import type { DriverStatus, RiderStatus } from './types';

export const CARBON = {
  canvas: '#121212',
  card: '#181818',
  line: '#3A3834',
  rider: '#38BDF8',
} as const;

export const DRIVER_STATUS_COLOR: Record<DriverStatus, string> = {
  AVAILABLE: '#4ADE80',
  EN_ROUTE: '#FBBF24',
  ON_TRIP: '#FB7185',
};

export const RIDER_STATUS_COLOR: Record<RiderStatus, string> = {
  WAITING: CARBON.rider,
  ASSIGNED: DRIVER_STATUS_COLOR.EN_ROUTE,
  PICKED_UP: DRIVER_STATUS_COLOR.ON_TRIP,
};

export const DLQ_ALERT = '#FB7185';
