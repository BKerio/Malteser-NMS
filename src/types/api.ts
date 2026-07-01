export type Role = 'SUPER_ADMIN' | 'ADMIN' | 'WATCHER' | 'DISPATCHER' | 'PARTNER' | 'DRIVER' | 'EMT' | 'NURSE';

export type TaskStatus =
  | 'PENDING'
  | 'ACCEPTED'
  | 'EN_ROUTE'
  | 'AT_SCENE'
  | 'PATIENT_PICKED'
  | 'AT_HOSPITAL'
  | 'COMPLETED'
  | 'CANCELLED';

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  agencyId: string;
  phone?: string;
}

export interface Vehicle {
  id: string;
  registrationNumber: string;
  imei: string;
}

export interface CrewMemberRef {
  id: string;
  name: string;
  phone?: string | null;
}

export interface VehicleWithCrew extends Vehicle {
  status?: string;
  currentDriver?: CrewMemberRef | null;
  currentEmt?: CrewMemberRef | null;
  currentNurse?: CrewMemberRef | null;
}

export interface PaginatedMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface TaskHistoryItem {
  id: string;
  status: TaskStatus;
  receivedAt: string;
  acceptedAt?: string | null;
  sceneArrivalAt?: string | null;
  patientPickAt?: string | null;
  facilityArrivalAt?: string | null;
  completedAt?: string | null;
  cancelledAt?: string | null;
  cancelReason?: string | null;
  pcrCount?: number;
  lastPcrAt?: string | null;
  incidentId: string;
  vehicleId: string;
  incident: Pick<Incident, 'id' | 'caseNumber' | 'chiefComplaint' | 'locationName' | 'subCounty'>;
  vehicle: Pick<Vehicle, 'id' | 'registrationNumber'>;
}

export interface Incident {
  id: string;
  caseNumber: string;
  status: string;
  chiefComplaint: string;
  locationName: string;
  subCounty: string;
  lat?: number | null;
  lng?: number | null;
  patientName?: string | null;
  patientAge?: string | null;
  patientGender?: string | null;
  patientContact?: string | null;
  dispatcherComments?: string | null;
  preHospitalManagement?: string | null;
  massCasualty: boolean;
}

export interface Task {
  id: string;
  status: TaskStatus;
  receivedAt: string;
  acceptedAt?: string | null;
  sceneArrivalAt?: string | null;
  patientPickAt?: string | null;
  facilityArrivalAt?: string | null;
  completedAt?: string | null;
  incidentId: string;
  vehicleId: string;
  driverId: string;
  emtId?: string | null;
  nurseId?: string | null;
  incident: Incident;
  vehicle: Vehicle;
  driver: { id: string; name: string; phone?: string | null };
  emt?: { id: string; name: string; phone?: string | null } | null;
  nurse?: { id: string; name: string; phone?: string | null } | null;
}

export interface PatientCareReport {
  id: string;
  taskId: string;
  uploaderId: string;
  note: string;
  filePath: string;
  mimeType: string;
  fileSize: number;
  createdAt: string;
}

export interface ApiResponse<T> {
  ok: boolean;
  data: T;
  message?: string;
}

export const RESPONDER_ROLES: Role[] = ['DRIVER', 'EMT', 'NURSE'];

export function isResponderRole(role: Role): boolean {
  return RESPONDER_ROLES.includes(role);
}
