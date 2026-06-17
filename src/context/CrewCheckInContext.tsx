import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { VehicleWithCrew } from '@/types/api';
import {
  checkInToVehicle,
  checkOutFromVehicle,
  getAgencyVehicles,
  getMyCheckIn,
} from '@/api/responder';
import { getErrorMessage } from '@/api/client';
import { useAuth } from '@/context/AuthContext';

interface CrewCheckInContextValue {
  myVehicle: VehicleWithCrew | null;
  vehicles: VehicleWithCrew[];
  isLoading: boolean;
  isRefreshing: boolean;
  isMutating: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  checkIn: (vehicleId: string) => Promise<void>;
  checkOut: () => Promise<void>;
}

const CrewCheckInContext = createContext<CrewCheckInContextValue | undefined>(undefined);

export function CrewCheckInProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [myVehicle, setMyVehicle] = useState<VehicleWithCrew | null>(null);
  const [vehicles, setVehicles] = useState<VehicleWithCrew[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isMutating, setIsMutating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!user) return;
    setIsRefreshing(true);
    setError(null);
    try {
      const [checkedIn, agencyVehicles] = await Promise.all([getMyCheckIn(), getAgencyVehicles()]);
      setMyVehicle(checkedIn);
      setVehicles(agencyVehicles);
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
      refresh();
    } else {
      setMyVehicle(null);
      setVehicles([]);
      setIsLoading(false);
    }
  }, [user, refresh]);

  const checkIn = useCallback(
    async (vehicleId: string) => {
      setIsMutating(true);
      setError(null);
      try {
        const vehicle = await checkInToVehicle(vehicleId);
        setMyVehicle(vehicle);
        setVehicles((prev) => prev.map((v) => (v.id === vehicle.id ? vehicle : v)));
      } catch (err) {
        const message = getErrorMessage(err);
        setError(message);
        throw new Error(message);
      } finally {
        setIsMutating(false);
      }
    },
    []
  );

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

  return (
    <CrewCheckInContext.Provider
      value={{
        myVehicle,
        vehicles,
        isLoading,
        isRefreshing,
        isMutating,
        error,
        refresh,
        checkIn,
        checkOut,
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
