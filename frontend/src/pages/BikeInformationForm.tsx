import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Bike as BikeIcon, 
  CheckCircle2, 
  AlertCircle, 
  Search, 
  Battery, 
  Gauge, 
  ShieldCheck,
  Building,
  User,
  ArrowRight,
  PlusCircle
} from 'lucide-react';
import { api } from '../services/api';
import { Bike, Hub } from '../types';
import { useInspection } from '../context/InspectionContext';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';

export const BikeInformationForm: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    selectedBike,
    setSelectedBike,
    selectedHubId,
    setSelectedHubId,
    inspectionType,
    setInspectionType,
    notes,
    setNotes
  } = useInspection();

  const [bikeInput, setBikeInput] = useState<string>(selectedBike?.bike_id || 'BD-GLF-101');
  const [isValidating, setIsValidating] = useState<boolean>(false);
  const [validationSuccess, setValidationSuccess] = useState<string>('');
  const [validationError, setValidationError] = useState<string>('');
  const [hubs, setHubs] = useState<Hub[]>([]);
  const [suggestedBikes, setSuggestedBikes] = useState<Bike[]>([]);

  useEffect(() => {
    let mounted = true;
    Promise.all([api.getHubs(), api.getBikes()]).then(([hubsRes, bikesRes]) => {
      if (mounted) {
        setHubs(hubsRes);
        setSuggestedBikes(bikesRes);
        if (!selectedBike && bikesRes.length > 0) {
          validateOrRegisterBike(bikeInput || bikesRes[0].bike_id);
        }
      }
    });
    return () => { mounted = false; };
  }, []);

  const validateOrRegisterBike = async (idToValidate: string) => {
    if (!idToValidate.trim()) {
      setValidationError('Please enter a valid Bike ID.');
      return;
    }
    setIsValidating(true);
    setValidationError('');
    setValidationSuccess('');

    try {
      // Backend automatically registers bike if it doesn't exist
      const bike = await api.getBike(idToValidate.trim().toUpperCase());
      setSelectedBike(bike);
      setBikeInput(bike.bike_id);
      setValidationSuccess(`Bike ${bike.bike_id} verified & synchronized with database.`);
    } catch (err: any) {
      setSelectedBike(null);
      setValidationError(err.detail || `Unable to identify Bike ID '${idToValidate}'.`);
    } finally {
      setIsValidating(false);
    }
  };

  const handleSelectQuickBike = (b: Bike) => {
    setBikeInput(b.bike_id);
    validateOrRegisterBike(b.bike_id);
  };

  const handleProceed = () => {
    if (!selectedBike) return;
    navigate('/inspection/camera');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fadeIn">
      
      {/* Step Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-ev-sm space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-bold bg-[#102A43] text-white px-2.5 py-0.5 rounded-lg">
            STEP 1 / 4
          </span>
          <span className="text-xs text-slate-500 font-medium">
            Vehicle Registration & Fleet Database Synchronization
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#102A43] tracking-tight">
          Identify Electric Bike for Inspection
        </h1>
        <p className="text-slate-600 text-sm leading-relaxed">
          Enter any Glafit Electric Bike ID. If it is a new bike, the system automatically registers it to the fleet database before proceeding to live camera inspection.
        </p>
      </div>

      {/* Main Identification Form Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-ev-sm space-y-8">
        
        {/* Bike ID Input & Validation */}
        <div className="space-y-4">
          <label className="block text-sm font-bold text-[#102A43]">
            Target Bike ID / Registration Number <span className="text-[#E5484D]">*</span>
          </label>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Search className="w-5 h-5" />
              </div>
              <input
                type="text"
                value={bikeInput}
                onChange={(e) => {
                  setBikeInput(e.target.value.toUpperCase());
                  setValidationError('');
                  setValidationSuccess('');
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') validateOrRegisterBike(bikeInput);
                }}
                placeholder="e.g. BD-GLF-101, BD-EV-201, BD-DHK-55"
                className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#1677FF] font-mono text-base uppercase font-semibold text-[#102A43] min-h-[48px]"
              />
            </div>

            <Button
              variant="primary"
              size="md"
              isLoading={isValidating}
              onClick={() => validateOrRegisterBike(bikeInput)}
              leftIcon={<ShieldCheck className="w-4 h-4" />}
              className="sm:w-48"
            >
              Verify / Auto-Save
            </Button>
          </div>

          {/* Quick select pills */}
          <div className="flex items-center gap-2 flex-wrap pt-1">
            <span className="text-xs text-slate-400 font-medium">Quick Select Fleet:</span>
            {suggestedBikes.map((b) => (
              <button
                key={b.bike_id}
                type="button"
                onClick={() => handleSelectQuickBike(b)}
                className={`px-3 py-1 rounded-lg text-xs font-mono font-medium transition-all min-h-[34px] ${
                  selectedBike?.bike_id === b.bike_id
                    ? 'bg-[#102A43] text-white shadow-sm'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                {b.bike_id}
              </button>
            ))}
          </div>

          {/* Validation Feedback */}
          {validationSuccess && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>{validationSuccess}</span>
            </div>
          )}

          {validationError && (
            <div className="p-4 rounded-xl bg-[#E5484D]/10 border border-[#E5484D]/30 text-[#E5484D] text-xs font-medium flex items-center gap-2 animate-fadeIn">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{validationError}</span>
            </div>
          )}
        </div>

        {/* Validated Bike Info Card */}
        {selectedBike && (
          <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-[#16A36A]" />
                <span className="font-bold text-sm text-[#102A43]">
                  Vehicle Confirmed in Fleet Database
                </span>
              </div>
              <Badge variant="pass">ACTIVE & REGISTERED</Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-center">
              {/* Bike Image */}
              <div className="sm:col-span-4 aspect-[4/3] rounded-xl overflow-hidden bg-slate-200 shadow-sm">
                {selectedBike.image_url ? (
                  <img
                    src={selectedBike.image_url}
                    alt={selectedBike.model_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400">
                    <BikeIcon className="w-10 h-10" />
                  </div>
                )}
              </div>

              {/* Bike Details */}
              <div className="sm:col-span-8 space-y-3">
                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    {selectedBike.brand}
                  </span>
                  <h3 className="text-lg font-bold text-[#102A43]">
                    {selectedBike.model_name}
                  </h3>
                  <p className="text-xs text-slate-500 font-mono">
                    Serial No: {selectedBike.serial_number}
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-3 pt-2">
                  <div className="p-2.5 rounded-xl bg-white border border-slate-200 text-center">
                    <span className="text-[10px] text-slate-400 block mb-0.5">Battery</span>
                    <span className="font-mono font-bold text-sm text-[#16A36A] flex items-center justify-center gap-1">
                      <Battery className="w-3.5 h-3.5" />
                      {selectedBike.battery_level}%
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-white border border-slate-200 text-center">
                    <span className="text-[10px] text-slate-400 block mb-0.5">Odometer</span>
                    <span className="font-mono font-bold text-sm text-[#102A43] flex items-center justify-center gap-1">
                      <Gauge className="w-3.5 h-3.5 text-[#1677FF]" />
                      {selectedBike.odometer_km} km
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-white border border-slate-200 text-center">
                    <span className="text-[10px] text-slate-400 block mb-0.5">Status</span>
                    <span className="font-semibold text-xs text-[#102A43] capitalize">
                      {selectedBike.status}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Hub / Station & Inspection Options */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
          
          {/* Hub Location Selection */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-[#102A43] uppercase tracking-wider flex items-center gap-1.5">
              <Building className="w-4 h-4 text-[#1677FF]" />
              Inspection Hub / Station (Bangladesh) <span className="text-[#E5484D]">*</span>
            </label>
            <select
              value={selectedHubId}
              onChange={(e) => setSelectedHubId(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#1677FF] text-sm text-[#102A43] font-medium bg-white min-h-[44px]"
            >
              {hubs.map((h) => (
                <option key={h.hub_id} value={h.hub_id}>
                  {h.name} — {h.address}
                </option>
              ))}
            </select>
          </div>

          {/* Inspection Type Selection */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-[#102A43] uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-[#1677FF]" />
              Inspection Type <span className="text-[#E5484D]">*</span>
            </label>
            <select
              value={inspectionType}
              onChange={(e) => setInspectionType(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#1677FF] text-sm text-[#102A43] font-medium bg-white min-h-[44px]"
            >
              <option value="pre_rental">Pre-Rental Customer Handover Inspection</option>
              <option value="post_rental">Post-Rental Return Check</option>
              <option value="periodic_maintenance">Periodic Safety Audit</option>
            </select>
          </div>
        </div>

        {/* Inspector & Notes */}
        <div className="space-y-4 pt-2">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-[#1677FF]" />
              <span className="text-slate-500">Inspector / Rider:</span>
              <strong className="text-[#102A43]">{user?.name || 'Tanvir Ahmed'}</strong>
            </div>
            <span className="font-mono text-slate-400">ID: {user?.user_id || 'USR-001'}</span>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-[#102A43] uppercase tracking-wider">
              Inspection Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Record any physical notes (e.g. road conditions, clean fairings, customer request)..."
              rows={2}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#1677FF] text-xs text-slate-700"
            />
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="text-xs text-slate-500">
            {selectedBike ? (
              <span className="text-[#16A36A] font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> Ready to proceed to live camera capture.
              </span>
            ) : (
              <span className="text-amber-600 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" /> Enter a Bike ID to continue.
              </span>
            )}
          </div>

          <Button
            variant="primary"
            size="lg"
            disabled={!selectedBike}
            onClick={handleProceed}
            rightIcon={<ArrowRight className="w-5 h-5" />}
            className="w-full sm:w-auto font-bold"
          >
            Proceed to Live Camera Inspection
          </Button>
        </div>
      </div>
    </div>
  );
};
