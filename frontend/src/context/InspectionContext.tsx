import React, { createContext, useContext, useState, useMemo, useEffect } from 'react';
import { Bike, CapturedImageView, InspectionRecord } from '../types';
import { MANDATORY_VIEW_IDS } from '../constants/views';

interface InspectionContextType {
  selectedBike: Bike | null;
  setSelectedBike: (bike: Bike | null) => void;
  selectedHubId: string;
  setSelectedHubId: (id: string) => void;
  inspectionType: string;
  setInspectionType: (type: string) => void;
  inspectorId: string;
  setInspectorId: (id: string) => void;
  inspectorName: string;
  setInspectorName: (name: string) => void;
  notes: string;
  setNotes: (notes: string) => void;
  capturedImages: Record<string, CapturedImageView>;
  setCapturedImage: (view: string, dataUrl: string) => void;
  removeCapturedImage: (view: string) => void;
  clearAllCaptured: () => void;
  resetSession: () => void;
  currentInspectionRecord: InspectionRecord | null;
  setCurrentInspectionRecord: (record: InspectionRecord | null) => void;
  allMandatoryCaptured: boolean;
  mandatoryProgress: {
    capturedCount: number;
    totalMandatory: number;
    percent: number;
  };
}

const InspectionContext = createContext<InspectionContextType | undefined>(undefined);

const STORAGE_KEY = 'glafit_active_inspection_session_v1';

export const InspectionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load session from sessionStorage if present (preserves memory across reload)
  const initialSession = useMemo(() => {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      if (stored) return JSON.parse(stored);
    } catch {
      // ignore
    }
    return null;
  }, []);

  const [selectedBike, setSelectedBike] = useState<Bike | null>(initialSession?.selectedBike || null);
  const [selectedHubId, setSelectedHubId] = useState<string>(initialSession?.selectedHubId || 'HUB-DHK-01');
  const [inspectionType, setInspectionType] = useState<string>(initialSession?.inspectionType || 'pre_rental');
  const [inspectorId, setInspectorId] = useState<string>(initialSession?.inspectorId || 'USR-001');
  const [inspectorName, setInspectorName] = useState<string>(initialSession?.inspectorName || 'Tanvir Ahmed');
  const [notes, setNotes] = useState<string>(initialSession?.notes || '');
  const [capturedImages, setCapturedImages] = useState<Record<string, CapturedImageView>>(
    initialSession?.capturedImages || {}
  );
  const [currentInspectionRecord, setCurrentInspectionRecord] = useState<InspectionRecord | null>(
    initialSession?.currentInspectionRecord || null
  );

  // Sync to sessionStorage
  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify({
        selectedBike,
        selectedHubId,
        inspectionType,
        inspectorId,
        inspectorName,
        notes,
        capturedImages,
        currentInspectionRecord
      }));
    } catch {
      // ignore if exceeded quota
    }
  }, [selectedBike, selectedHubId, inspectionType, inspectorId, inspectorName, notes, capturedImages, currentInspectionRecord]);

  const setCapturedImage = (view: string, dataUrl: string) => {
    setCapturedImages((prev) => ({
      ...prev,
      [view]: {
        view,
        image_data: dataUrl,
        client_timestamp: new Date().toISOString()
      }
    }));
  };

  const removeCapturedImage = (view: string) => {
    setCapturedImages((prev) => {
      const copy = { ...prev };
      delete copy[view];
      return copy;
    });
  };

  const clearAllCaptured = () => {
    setCapturedImages({});
  };

  const resetSession = () => {
    setSelectedBike(null);
    setCapturedImages({});
    setCurrentInspectionRecord(null);
    setNotes('');
    sessionStorage.removeItem(STORAGE_KEY);
  };

  const mandatoryProgress = useMemo(() => {
    const capturedMandatory = MANDATORY_VIEW_IDS.filter((id) => !!capturedImages[id]);
    const capturedCount = capturedMandatory.length;
    const totalMandatory = MANDATORY_VIEW_IDS.length;
    const percent = Math.round((capturedCount / totalMandatory) * 100);
    return { capturedCount, totalMandatory, percent };
  }, [capturedImages]);

  const allMandatoryCaptured = mandatoryProgress.capturedCount === mandatoryProgress.totalMandatory;

  return (
    <InspectionContext.Provider
      value={{
        selectedBike,
        setSelectedBike,
        selectedHubId,
        setSelectedHubId,
        inspectionType,
        setInspectionType,
        inspectorId,
        setInspectorId,
        inspectorName,
        setInspectorName,
        notes,
        setNotes,
        capturedImages,
        setCapturedImage,
        removeCapturedImage,
        clearAllCaptured,
        resetSession,
        currentInspectionRecord,
        setCurrentInspectionRecord,
        allMandatoryCaptured,
        mandatoryProgress
      }}
    >
      {children}
    </InspectionContext.Provider>
  );
};

export const useInspection = () => {
  const context = useContext(InspectionContext);
  if (!context) {
    throw new Error('useInspection must be used within an InspectionProvider');
  }
  return context;
};
