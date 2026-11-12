import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { InspectionRecord } from '../types';
import { InspectionSuccess } from '../components/inspection/InspectionSuccess';
import { InspectionFailure } from '../components/inspection/InspectionFailure';
import { ManualReview } from '../components/inspection/ManualReview';
import { Button } from '../components/ui/Button';
import { AlertCircle, RefreshCw, Home, Cpu } from 'lucide-react';

export const InspectionResultPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [inspection, setInspection] = useState<InspectionRecord | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (!id) return;
    let mounted = true;
    setLoading(true);
    setError('');

    api.getInspection(id)
      .then((record) => {
        if (mounted) {
          setInspection(record);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (mounted) {
          setError(err.detail || 'Inspection record could not be found.');
          setLoading(false);
        }
      });

    return () => { mounted = false; };
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-[#102A43] text-[#1677FF] flex items-center justify-center mx-auto shadow-md animate-pulse">
          <Cpu className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-[#102A43]">Loading Inspection Telemetry...</h3>
        <p className="text-xs text-slate-500 font-mono">RETRIEVING RECORD ID: {id}</p>
      </div>
    );
  }

  if (error || !inspection) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-[#E5484D]/10 text-[#E5484D] flex items-center justify-center mx-auto">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-[#102A43]">Inspection Not Found</h3>
        <p className="text-xs text-slate-500">{error || 'The requested inspection ID does not exist.'}</p>
        <div className="pt-2 flex justify-center gap-3">
          <Button variant="outline" size="sm" onClick={() => navigate('/')} leftIcon={<Home className="w-4 h-4" />}>
            Back to Dashboard
          </Button>
          <Button variant="primary" size="sm" onClick={() => navigate('/new-inspection')}>
            Start New Inspection
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {inspection.status === 'PASS' && (
        <InspectionSuccess inspection={inspection} />
      )}

      {inspection.status === 'FAIL' && (
        <InspectionFailure inspection={inspection} />
      )}

      {inspection.status === 'MANUAL_REVIEW' && (
        <ManualReview inspection={inspection} />
      )}
    </div>
  );
};
