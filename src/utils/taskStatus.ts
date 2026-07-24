import type { TaskStatus } from '@/types/api';

export const STATUS_LABELS: Record<TaskStatus, string> = {
  PENDING: 'Pending',
  ACCEPTED: 'Accepted',
  EN_ROUTE: 'En Route',
  AT_SCENE: 'At Scene',
  PATIENT_PICKED: 'Patient Picked Up',
  AT_HOSPITAL: 'At Hospital',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};

export const NEXT_STATUS: Partial<Record<TaskStatus, TaskStatus>> = {
  PENDING: 'ACCEPTED',
  ACCEPTED: 'EN_ROUTE',
  EN_ROUTE: 'AT_SCENE',
  AT_SCENE: 'PATIENT_PICKED',
  PATIENT_PICKED: 'AT_HOSPITAL',
  AT_HOSPITAL: 'COMPLETED',
};

export const ACTION_LABELS: Partial<Record<TaskStatus, string>> = {
  PENDING: 'Accept Assignment',
  ACCEPTED: 'Start En Route',
  EN_ROUTE: 'Arrived at Scene',
  AT_SCENE: 'Patient Picked Up',
  PATIENT_PICKED: 'Arrived at the hospital',
  AT_HOSPITAL: 'Complete Task',
};

export const STATUS_ORDER: TaskStatus[] = [
  'PENDING',
  'ACCEPTED',
  'EN_ROUTE',
  'AT_SCENE',
  'PATIENT_PICKED',
  'AT_HOSPITAL',
  'COMPLETED',
];

export function getNextStatus(current: TaskStatus): TaskStatus | null {
  return NEXT_STATUS[current] ?? null;
}
