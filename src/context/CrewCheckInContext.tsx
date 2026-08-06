import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import type { PartnerAmbulance, VehicleWithCrew } from '@/types/api';
import {
  assignVehicleCrew,
  checkInToVehicle,
  checkOutFromVehicle,
  getAgencyVehicles,
  getMyCheckIn,
  getPartnerAmbulances,
  resumePendingCheckInUpload,
} from '@/api/responder';
import { getErrorMessage } from '@/api/client';
import { useAuth } from '@/context/AuthContext';
import {
  clearPendingCheckIn,
  getPendingCheckIn,
  type PendingCheckIn,
} from '@/stores/pendingCheckIn';

interface CrewCheckInContextValue {
  myVehicle: VehicleWithCrew | null;
  vehicles: VehicleWithCrew[];
  partnerAmbulances: PartnerAmbulance[];
  isLoading: boolean;
  isRefreshing: boolean;
  isMutating: boolean;
  error: string | null;
  pendingCheckIn: PendingCheckIn | null;
  refresh: () => Promise<void>;
  checkIn: (vehicleId: string, opts?: { registrationNumber?: string }) => Promise<void>;
  checkOut: () => Promise<void>;
  assignCrew: (crew: { emtId?: string | null; nurseId?: string | null }) => Promise<VehicleWithCrew>;
  dismissPendingCheckIn: () => Promise<void>;
}

const CrewCheckInContext = createContext<CrewCheckInContextValue | undefined>(undefined);

export function CrewCheckInProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [myVehicle, setMyVehicle] = useState<VehicleWithCrew | null>(null);
  const [vehicles, setVehicles] = useState<VehicleWithCrew[]>([]);
  const [partnerAmbulances, setPartnerAmbulances] = useState<PartnerAmbulance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isMutating, setIsMutating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingCheckIn, setPendingCheckIn] = useState<PendingCheckIn | null>(null);
  const triedResumeRef = useRef(false);

  const refresh = useCallback(async () => {
    if (!user) return;
    setIsRefreshing(true);
    setError(null);
    try {
      const [checkedIn, agencyVehicles, partners, pending] = await Promise.all([
        getMyCheckIn(),
        getAgencyVehicles(),
        getPartnerAmbulances().catch(() => [] as PartnerAmbulance[]),
        getPendingCheckIn(),
      ]);
      setMyVehicle(checkedIn);
      setVehicles(agencyVehicles);
      setPartnerAmbulances(partners);
      setPendingCheckIn(checkedIn ? null : pending);
      if (checkedIn) await clearPendingCheckIn();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      setIsLoading(true);
      triedResumeRef.current = false;
      refresh();
    } else {
      setMyVehicle(null);
      setVehicles([]);
      setPartnerAmbulances([]);
      setPendingCheckIn(null);
      setIsLoading(false);
    }
  }, [user, refresh]);

  // After Android remounts from the camera: if selfie + GPS were saved, finish upload quietly
  useEffect(() => {
    if (!user || myVehicle || triedResumeRef.current) return;
    triedResumeRef.current = true;
    let cancelled = false;
    (async () => {
      try {
        const pending = await getPendingCheckIn();
        if (!pending?.selfieUri || pending.lat == null || pending.lng == null) {
          if (!cancelled) setPendingCheckIn(pending);
          return;
        }
        setIsMutating(true);
        const vehicle = await resumePendingCheckInUpload();
        if (cancelled || !vehicle) return;
        setMyVehicle(vehicle);
        setVehicles((prev) => prev.map((v) => (v.id === vehicle.id ? vehicle : v)));
        setPendingCheckIn(null);
      } catch {
        const pending = await getPendingCheckIn();
        if (!cancelled) setPendingCheckIn(pending);
      } finally {
        if (!cancelled) setIsMutating(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, myVehicle]);

  const checkIn = useCallback(async (vehicleId: string, opts?: { registrationNumber?: string }) => {
    setIsMutating(true);
    setError(null);
    try {
      const vehicle = await checkInToVehicle(vehicleId, opts);
      setMyVehicle(vehicle);
      setVehicles((prev) => prev.map((v) => (v.id === vehicle.id ? vehicle : v)));
      setPendingCheckIn(null);
    } catch (err) {
      const message = getErrorMessage(err);
      setError(message);
      const pending = await getPendingCheckIn();
      setPendingCheckIn(pending);
      throw new Error(message);
    } finally {
      setIsMutating(false);
    }
  }, []);

  const checkOut = useCallback(async () => {
    if (!myVehicle) return;
    setIsMutating(true);
    setError(null);
    try {
      const vehicle = await checkOutFromVehicle(myVehicle.id);
      setMyVehicle(null);
      setVehicles((prev) => prev.map((v) => (v.id === vehicle.id ? vehicle : v)));
    } catch (err) {
      const message = getErrorMessage(err);
      setError(message);
      throw new Error(message);
    } finally {
      setIsMutating(false);
    }
  }, [myVehicle]);

  const assignCrew = useCallback(
    async (crew: { emtId?: string | null; nurseId?: string | null }) => {
      if (!myVehicle) throw new Error('Check in to a vehicle before assigning crew.');
      setIsMutating(true);
      setError(null);
      try {
        const vehicle = await assignVehicleCrew(myVehicle.id, crew);
        setMyVehicle(vehicle);
        setVehicles((prev) => prev.map((v) => (v.id === vehicle.id ? vehicle : v)));
        return vehicle;
      } catch (err) {
        const message = getErrorMessage(err);
        setError(message);
        throw new Error(message);
      } finally {
        setIsMutating(false);
      }
    },
    [myVehicle]
  );

  const dismissPendingCheckIn = useCallback(async () => {
    await clearPendingCheckIn();
    setPendingCheckIn(null);
  }, []);

  return (
    <CrewCheckInContext.Provider
      value={{
        myVehicle,
        vehicles,
        partnerAmbulances,
        isLoading,
        isRefreshing,
        isMutating,
        error,
        pendingCheckIn,
        refresh,
        checkIn,
        checkOut,
        assignCrew,
        dismissPendingCheckIn,
      }}
    >
      {children}
    </CrewCheckInContext.Provider>
  );
}

export function useCrewCheckIn() {
  const ctx = useContext(CrewCheckInContext);
  if (!ctx) throw new Error('useCrewCheckIn must be used within CrewCheckInProvider');
  return ctx;
}
