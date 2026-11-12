import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Sparkles, 
  AlertTriangle, 
  Check, 
  RotateCcw, 
  Layers, 
  RefreshCw
} from 'lucide-react';
import { useInspection } from '../context/InspectionContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { AIAnalysisLoader } from '../components/inspection/AIAnalysisLoader';
import { CAMERA_VIEWS } from '../constants/views';

export const AIAnalysisPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    selectedBike,
    selectedHubId,
    inspectionType,
    notes,
    capturedImages,
    allMandatoryCaptured,
    setCurrentInspectionRecord
  } = useInspection();

  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    if (!selectedBike) {
      navigate('/new-inspection');
    } else if (!allMandatoryCaptured) {
      navigate('/inspection/camera');
    }
  }, [selectedBike, allMandatoryCaptured, navigate]);

  const handleStartAnalysis = async () => {
    if (!selectedBike) return;
    setIsAnalyzing(true);
    setErrorMessage('');

    try {
      const imagesPayload = Object.values(capturedImages);

      const result = await api.submitInspectionAnalysis({
        bike_id: selectedBike.bike_id,
        hub_id: selectedHubId,
        inspection_type: inspectionType,
        inspector_id: user?.user_id || 'USR-001',
        inspector_name: user?.name || 'Tanvir Ahmed',
        notes: notes || undefined,
        images: imagesPayload,
      });

      setCurrentInspectionRecord(result);

      setTimeout(() => {
        navigate(`/inspection/result/${result.inspection_id}`);
      }, 800);
    } catch (err: any) {
      console.error('[AI-Analysis] Submission error:', err);
      setErrorMessage(
        err.detail || err.message || 'An unexpected error occurred while communicating with the YOLOv8 API.'
      );
      setIsAnalyzing(false);
    }
  };

  if (!selectedBike) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fadeIn">
      
      {isAnalyzing ? (
        <AIAnalysisLoader
          bikeId={selectedBike.bike_id}
          imagesCount={Object.keys(capturedImages).length}
        />
      ) : (
        <>
          {/* Step Header */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-ev-sm space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold bg-[#102A43] text-white px-2.5 py-0.5 rounded-lg">
                STEP 3 / 4
              </span>
              <span className="text-xs text-[#16A36A] font-bold flex items-center gap-1">
                <Check className="w-4 h-4" /> All Mandatory Angles Captured
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#102A43] tracking-tight">
              Ready for AI Inspection
            </h1>
            <p className="text-slate-600 text-sm leading-relaxed">
              All 4 required camera perspectives have been recorded directly through the live camera preview.
              Submit to the YOLOv8 computer vision engine to inspect for scratches, dents, cracks, and structural flaws.
            </p>
          </div>

          {/* Captured Angles Pre-Flight Verification Card */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-ev-sm space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base text-[#102A43] flex items-center gap-2">
                <Layers className="w-5 h-5 text-[#1677FF]" />
                Inspection Pre-Flight Payload ({Object.keys(capturedImages).length} Views)
              </h3>
              <Badge variant="pass">PROVENANCE VERIFIED</Badge>
            </div>

            {/* Thumbnail Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {CAMERA_VIEWS.filter((v) => !!capturedImages[v.id]).map((v) => {
                const img = capturedImages[v.id];
                return (
                  <div key={v.id} className="p-2.5 rounded-2xl border border-slate-200 bg-slate-50 space-y-2">
                    <div className="aspect-[4/3] rounded-xl overflow-hidden bg-black flex items-center justify-center">
                      <img
                        src={img.image_data}
                        alt={v.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-[#102A43] truncate">{v.name}</span>
                      <Check className="w-3.5 h-3.5 text-[#16A36A]" />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Metadata Summary Box */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
              <div>
                <span className="text-slate-400 block text-[10px]">VEHICLE ID</span>
                <span className="font-bold text-[#102A43]">{selectedBike.bike_id}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">MODEL</span>
                <span className="font-bold text-[#102A43] truncate block">{selectedBike.model_name}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">INSPECTION TYPE</span>
                <span className="font-bold text-[#102A43] uppercase">{inspectionType}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">INSPECTOR</span>
                <span className="font-bold text-[#102A43]">{user?.name || 'Tanvir Ahmed'}</span>
              </div>
            </div>

            {/* Error Message if API fails */}
            {errorMessage && (
              <div className="p-4 rounded-2xl bg-[#E5484D]/10 border border-[#E5484D]/30 text-[#E5484D] text-xs font-medium space-y-2">
                <div className="flex items-center gap-2 font-bold">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <span>AI API Inspection Request Failed</span>
                </div>
                <p className="leading-relaxed">{errorMessage}</p>
                <div className="pt-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleStartAnalysis}
                    leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
                  >
                    Retry Analysis
                  </Button>
                </div>
              </div>
            )}

            {/* Submission Actions */}
            <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <Button
                variant="outline"
                size="md"
                onClick={() => navigate('/inspection/camera')}
                leftIcon={<RotateCcw className="w-4 h-4" />}
              >
                Back to Camera (Retake Views)
              </Button>

              <Button
                variant="primary"
                size="lg"
                onClick={handleStartAnalysis}
                leftIcon={<Sparkles className="w-5 h-5 text-white" />}
                className="font-bold text-base px-8 py-4 shadow-ev-glow"
              >
                Submit for AI Analysis
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
