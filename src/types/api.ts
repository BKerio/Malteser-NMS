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

export interface PatientVitals {
  temperature?: string;
  pulseRate?: string;
  respirationRate?: string;
  bp?: string;
  spo2?: string;
  fh?: string;
}

export interface MaternityVitals {
  admissionDateTime?: string;
  parity?: string;
  gravid?: string;
  fetalHeartRate?: string;
  membranes?: string;
  characterOfLiquor?: string;
  moulding?: string;
  cervicalDilatation?: string;
  descent?: string;
  uterineContraction?: string;
  medicationsFetal?: string;
  bp?: string;
  pulse?: string;
  temperature?: string;
  rbs?: string;
  spo2?: string;
  gcs?: string;
  proteinInUrine?: string;
  glucoseInUrine?: string;
  urineOutput?: string;
  deliveryDateTime?: string;
  modeOfDelivery?: string;
  newbornGender?: string;
  birthWeight?: string;
  conditionOfBaby?: string;
  medicationNewborn?: string;
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
  patientNhif?: string | null;
  nextOfKin?: string | null;
  nextOfKinPhone?: string | null;
  alertNature?: string | null;
  alertNatureDetail?: string | null;
  placeOfReferral?: string | null;
  isGbvCase?: boolean;
  dispatcherComments?: string | null;
  dispatcherChallenges?: string | null;
  preHospitalManagement?: string | null;
  watcherComments?: string | null;
  partnerNotes?: string | null;
  massCasualty: boolean;
  massCasualtyCount?: number | null;
  vitals?: PatientVitals | null;
  maternityVitals?: MaternityVitals | null;
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
