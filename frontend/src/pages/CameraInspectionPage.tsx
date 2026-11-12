import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useInspection } from '../context/InspectionContext';
import { CameraCapture } from '../components/camera/CameraCapture';

export const CameraInspectionPage: React.FC = () => {
  const navigate = useNavigate();
  const { selectedBike } = useInspection();

  useEffect(() => {
    // If no bike selected, redirect to bike info form
    if (!selectedBike) {
      navigate('/new-inspection');
    }
  }, [selectedBike, navigate]);

  if (!selectedBike) return null;

  return (
    <div className="py-4">
      <CameraCapture />
    </div>
  );
};
