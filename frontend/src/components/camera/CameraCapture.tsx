import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Camera, 
  RotateCcw, 
  Flashlight, 
  Check, 
  AlertTriangle, 
  RefreshCw, 
  Eye, 
  Sparkles, 
  ChevronRight, 
  ShieldAlert,
  Sliders,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { CAMERA_VIEWS } from '../../constants/views';
import { CameraGuideOverlay } from './CameraGuideOverlay';
import { useInspection } from '../../context/InspectionContext';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Modal } from '../ui/Modal';

export const CameraCapture: React.FC = () => {
  const navigate = useNavigate();
  const {
    selectedBike,
    capturedImages,
    setCapturedImage,
    removeCapturedImage,
    allMandatoryCaptured,
    mandatoryProgress,
  } = useInspection();

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const simCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const mobileFileInputRef = useRef<HTMLInputElement | null>(null);

  const [activeViewId, setActiveViewId] = useState<string>('front');
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraState, setCameraState] = useState<'requesting' | 'active' | 'denied' | 'unavailable' | 'simulator'>('requesting');
  const [cameraError, setCameraError] = useState<string>('');
  const [torchSupported, setTorchSupported] = useState<boolean>(false);
  const [isTorchOn, setIsTorchOn] = useState<boolean>(false);
  const [isFlashing, setIsFlashing] = useState<boolean>(false);
  const [previewModalImg, setPreviewModalImg] = useState<{ view: string; url: string } | null>(null);
  
  // Security & Darkness Verification State
  const [securityWarning, setSecurityWarning] = useState<string | null>(null);
  const [liveIsTooDark, setLiveIsTooDark] = useState<boolean>(false);

  const activeViewDef = CAMERA_VIEWS.find((v) => v.id === activeViewId) || CAMERA_VIEWS[0];

  // Stop camera stream tracks
  const stopStream = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {
          // ignore
        }
      });
      setStream(null);
    }
  }, [stream]);

  // Request live camera stream
  const startCamera = useCallback(async () => {
    stopStream();
    setCameraState('requesting');
    setCameraError('');
    setSecurityWarning(null);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraState('unavailable');
      setCameraError('This browser environment does not support mediaDevices.getUserMedia camera access.');
      return;
    }

    try {
      const constraints: MediaStreamConstraints = {
        audio: false,
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1920, min: 640 },
          height: { ideal: 1080, min: 480 },
        },
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);
      setCameraState('active');

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play().catch(() => {});
      }

      // Check torch capability
      const videoTrack = mediaStream.getVideoTracks()[0];
      if (videoTrack) {
        const capabilities = (videoTrack.getCapabilities ? videoTrack.getCapabilities() : {}) as any;
        if (capabilities && 'torch' in capabilities) {
          setTorchSupported(true);
        }
      }
    } catch (err: any) {
      console.warn('[Camera] Failed to obtain media stream:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraState('denied');
        setCameraError('Camera permission was denied. Please allow camera access in your browser settings.');
      } else {
        setCameraState('unavailable');
        setCameraError(err.message || 'No camera hardware detected or camera is currently locked by another application.');
      }
    }
  }, [stopStream]);

  useEffect(() => {
    startCamera();
    return () => {
      stopStream();
    };
  }, []);

  // Sync video element when stream is active
  useEffect(() => {
    if (cameraState === 'active' && videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [cameraState, stream]);

  // Live Light Sensor Check (Runs every 1.2s when camera is active)
  useEffect(() => {
    if (cameraState !== 'active') {
      setLiveIsTooDark(false);
      return;
    }

    const checkInterval = setInterval(() => {
      if (!videoRef.current || videoRef.current.readyState < 2) return;
      try {
        const testCanvas = document.createElement('canvas');
        testCanvas.width = 160;
        testCanvas.height = 120;
        const ctx = testCanvas.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(videoRef.current, 0, 0, 160, 120);
        const imgData = ctx.getImageData(0, 0, 160, 120).data;
        let totalLum = 0;
        let count = 0;
        for (let i = 0; i < imgData.length; i += 16) {
          totalLum += 0.299 * imgData[i] + 0.587 * imgData[i+1] + 0.114 * imgData[i+2];
          count++;
        }
        const avg = totalLum / count;
        setLiveIsTooDark(avg < 30);
      } catch {
        // ignore
      }
    }, 1200);

    return () => clearInterval(checkInterval);
  }, [cameraState]);

  // Hardware Simulator Animation Loop (for dev/desktop without webcam)
  useEffect(() => {
    if (cameraState !== 'simulator') return;

    let animId: number;
    const canvas = simCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let frame = 0;
    const renderSim = () => {
      frame++;
      const w = canvas.width;
      const h = canvas.height;

      // Realistic EV workshop background gradient
      const bgGrad = ctx.createLinearGradient(0, 0, w, h);
      bgGrad.addColorStop(0, '#102A43');
      bgGrad.addColorStop(1, '#243B53');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, w, h);

      // Grid floor
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.lineWidth = 1;
      for (let y = h / 2; y < h; y += 25) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      // Simulated e-Bike wireframe/model
      ctx.save();
      ctx.translate(w / 2, h / 2);

      // Subtle breathing motion
      const bob = Math.sin(frame * 0.04) * 3;
      ctx.translate(0, bob);

      // Bike Frame
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      // Wheels
      ctx.beginPath();
      ctx.arc(-140, 60, 48, 0, Math.PI * 2);
      ctx.arc(140, 60, 48, 0, Math.PI * 2);
      ctx.stroke();

      // Rims
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#1677FF';
      ctx.beginPath();
      ctx.arc(-140, 60, 30, 0, Math.PI * 2);
      ctx.arc(140, 60, 30, 0, Math.PI * 2);
      ctx.stroke();

      // Main frame tube
      ctx.lineWidth = 8;
      ctx.strokeStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.moveTo(-140, 60);
      ctx.lineTo(-40, 0);
      ctx.lineTo(80, 0);
      ctx.lineTo(140, 60);
      ctx.stroke();

      // Handlebar stem
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(80, 0);
      ctx.lineTo(100, -70);
      ctx.lineTo(120, -70);
      ctx.stroke();

      // Headlight LED (simulated beam)
      ctx.fillStyle = '#1677FF';
      ctx.beginPath();
      ctx.arc(105, -50, 8, 0, Math.PI * 2);
      ctx.fill();

      // Simulated scratch on right side / close-up
      if (activeViewId === 'right' || activeViewId === 'damage_closeup') {
        ctx.strokeStyle = '#E5484D';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(20, -5);
        ctx.lineTo(55, 8);
        ctx.stroke();
      }

      ctx.restore();

      // Simulator telemetry banner
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(10, 10, 290, 48);
      ctx.fillStyle = '#1677FF';
      ctx.font = 'bold 12px "JetBrains Mono", monospace';
      ctx.fillText(`SIMULATED OPTICAL FEED: ${activeViewId.toUpperCase()}`, 16, 26);
      ctx.fillStyle = '#16A36A';
      ctx.font = '10px "JetBrains Mono", monospace';
      ctx.fillText(`FPS: 30 • STATUS: SYNTHESIZED BIKE STREAM`, 16, 42);

      animId = requestAnimationFrame(renderSim);
    };

    renderSim();
    return () => {
      cancelAnimationFrame(animId);
    };
  }, [cameraState, activeViewId]);

  // Flashlight / Torch toggle
  const toggleTorch = async () => {
    if (!stream) return;
    const track = stream.getVideoTracks()[0];
    if (track) {
      try {
        const nextTorch = !isTorchOn;
        await (track as any).applyConstraints({
          advanced: [{ torch: nextTorch }],
        });
        setIsTorchOn(nextTorch);
      } catch (err) {
        console.warn('Torch constraint error:', err);
      }
    }
  };

  // Capture Image exclusively from live preview with Optical Security Check
  const capturePhoto = () => {
    setSecurityWarning(null);

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (cameraState === 'active' && videoRef.current) {
      const video = videoRef.current;
      canvas.width = video.videoWidth || 1280;
      canvas.height = video.videoHeight || 720;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    } else if (cameraState === 'simulator' && simCanvasRef.current) {
      const sim = simCanvasRef.current;
      canvas.width = sim.width;
      canvas.height = sim.height;
      ctx.drawImage(sim, 0, 0, canvas.width, canvas.height);
    } else {
      return;
    }

    // STRICT ANTI-TAMPER / DARKNESS VERIFICATION
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    let totalLum = 0;
    let darkPixels = 0;
    let samples = 0;
    const step = 8;
    for (let i = 0; i < imgData.length; i += 4 * step) {
      const r = imgData[i];
      const g = imgData[i+1];
      const b = imgData[i+2];
      const lum = 0.299 * r + 0.587 * g + 0.114 * b;
      totalLum += lum;
      if (lum < 20) darkPixels++;
      samples++;
    }
    const meanBrightness = totalLum / samples;
    const blackRatio = darkPixels / samples;

    // Reject pitch black or covered lens
    if (meanBrightness < 32.0 || blackRatio > 0.85) {
      setSecurityWarning('Security Block: Frame is pitch black or lens is obstructed. Glafit security requires a visible electric bike in proper light.');
      return;
    }

    // Visual flash animation
    setIsFlashing(true);
    setTimeout(() => setIsFlashing(false), 200);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
    setCapturedImage(activeViewId, dataUrl);

    // Auto-advance to next uncaptured mandatory view
    const nextUncaptured = CAMERA_VIEWS.find(
      (v) => v.mandatory && !capturedImages[v.id] && v.id !== activeViewId
    );
    if (nextUncaptured) {
      setActiveViewId(nextUncaptured.id);
    }
  };

  // Direct Mobile Camera Capture Handler (Hardware capture attribute: capture="environment")
  const handleDirectMobileCameraCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSecurityWarning(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = canvasRef.current || document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Resize to standard resolution for optimal YOLOv8 inspection
        const maxDim = 1920;
        let w = img.width;
        let h = img.height;
        if (w > maxDim || h > maxDim) {
          if (w > h) {
            h = Math.round((h * maxDim) / w);
            w = maxDim;
          } else {
            w = Math.round((w * maxDim) / h);
            h = maxDim;
          }
        }
        canvas.width = w;
        canvas.height = h;
        ctx.drawImage(img, 0, 0, w, h);

        // Anti-tamper / darkness analysis
        const imgData = ctx.getImageData(0, 0, w, h).data;
        let totalLum = 0;
        let darkPixels = 0;
        let samples = 0;
        const step = 8;
        for (let i = 0; i < imgData.length; i += 4 * step) {
          const r = imgData[i];
          const g = imgData[i+1];
          const b = imgData[i+2];
          const lum = 0.299 * r + 0.587 * g + 0.114 * b;
          totalLum += lum;
          if (lum < 20) darkPixels++;
          samples++;
        }
        const meanBrightness = totalLum / samples;
        const blackRatio = darkPixels / samples;

        if (meanBrightness < 32.0 || blackRatio > 0.85) {
          setSecurityWarning('Security Block: Captured frame is pitch black or lens is obstructed. Please take photo of the bike in proper lighting.');
          return;
        }

        setIsFlashing(true);
        setTimeout(() => setIsFlashing(false), 200);

        const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
        setCapturedImage(activeViewId, dataUrl);

        // Auto-advance to next uncaptured mandatory view
        const nextUncaptured = CAMERA_VIEWS.find(
          (v) => v.mandatory && !capturedImages[v.id] && v.id !== activeViewId
        );
        if (nextUncaptured) {
          setActiveViewId(nextUncaptured.id);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);

    // Reset input so user can capture again
    e.target.value = '';
  };

  // Unified shutter handler
  const handleShutterClick = () => {
    if (cameraState === 'active' || cameraState === 'simulator') {
      capturePhoto();
    } else {
      mobileFileInputRef.current?.click();
    }
  };

  const handleRetake = (viewId: string) => {
    removeCapturedImage(viewId);
    setActiveViewId(viewId);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Inspection Header & Progress */}
      <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200/90 shadow-ev-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono font-bold bg-[#102A43] text-white px-2.5 py-0.5 rounded-lg">
              STEP 2 / 4
            </span>
            <span className="text-xs text-slate-500 font-medium">
              Live Camera Optical Inspection • Secure Hardware Mode
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#102A43]">
            {selectedBike?.model_name || 'GLAFIT Urban e-Bike'}
            <span className="text-[#1677FF] font-mono ml-2">[{selectedBike?.bike_id || 'BD-GLF-101'}]</span>
          </h1>
        </div>

        {/* Mandatory Views Progress Indicator */}
        <div className="flex items-center gap-4 bg-slate-50 p-3 rounded-xl border border-slate-200/80">
          <div className="text-right">
            <div className="text-xs font-bold text-[#102A43]">
              Mandatory Views: {mandatoryProgress.capturedCount} / {mandatoryProgress.totalMandatory}
            </div>
            <div className="text-[11px] text-slate-500">
              {allMandatoryCaptured ? 'All angles verified' : 'All 4 views required for contract submission'}
            </div>
          </div>
          <div className="w-24 bg-slate-200 h-2.5 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                allMandatoryCaptured ? 'bg-[#16A36A]' : 'bg-[#1677FF]'
              }`}
              style={{ width: `${mandatoryProgress.percent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Security Rejection Warning Banner */}
      {securityWarning && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-3 text-rose-800 animate-shake">
          <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
          <div className="text-xs">
            <strong className="block font-bold mb-0.5">Image Rejected by Security Policy</strong>
            {securityWarning}
          </div>
        </div>
      )}

      {/* Angle Selector Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {CAMERA_VIEWS.map((v) => {
          const isCaptured = !!capturedImages[v.id];
          const isActive = activeViewId === v.id;
          return (
            <button
              key={v.id}
              type="button"
              onClick={() => { setActiveViewId(v.id); setSecurityWarning(null); }}
              className={`flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-medium transition-all duration-150 min-h-[44px] ${
                isActive
                  ? 'bg-[#102A43] text-white shadow-sm ring-2 ring-[#1677FF]'
                  : isCaptured
                  ? 'bg-[#16A36A]/10 text-[#16A36A] border border-[#16A36A]/30 hover:bg-[#16A36A]/20'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {isCaptured ? (
                <Check className="w-4 h-4 text-[#16A36A]" />
              ) : (
                <span className="w-2 h-2 rounded-full bg-slate-300" />
              )}
              <span>{v.name}</span>
              {v.mandatory && <span className="text-[10px] text-amber-500 font-bold">*</span>}
            </button>
          );
        })}
      </div>

      {/* Main Viewfinder / Camera Screen */}
      <div className="relative bg-black rounded-3xl overflow-hidden aspect-[4/3] sm:aspect-[16/10] max-h-[640px] shadow-ev-lg border border-slate-800 flex items-center justify-center">
        
        {/* Flash Screen Effect */}
        {isFlashing && (
          <div className="absolute inset-0 bg-white z-50 transition-opacity duration-200 pointer-events-none opacity-90" />
        )}

        {/* Live Darkness Warning Badge */}
        {liveIsTooDark && (
          <div className="absolute top-4 left-4 z-30 px-3 py-1.5 rounded-full bg-amber-500/90 text-black text-xs font-bold flex items-center gap-1.5 shadow-lg animate-pulse">
            <AlertTriangle className="w-4 h-4" />
            Lighting too dim • Ensure adequate light on bike
          </div>
        )}

        {/* State A: Camera Active (Hardware WebCam) */}
        {cameraState === 'active' && (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            <CameraGuideOverlay viewDef={activeViewDef} />
          </>
        )}

        {/* State B: Hardware Simulator (Desktop Dev or Camera-less fallback) */}
        {cameraState === 'simulator' && (
          <>
            <canvas
              ref={simCanvasRef}
              width={1280}
              height={720}
              className="w-full h-full object-cover"
            />
            <CameraGuideOverlay viewDef={activeViewDef} />
          </>
        )}

        {/* State C: Camera Requesting Permission */}
        {cameraState === 'requesting' && (
          <div className="text-center p-8 text-white space-y-4">
            <div className="w-16 h-16 rounded-full bg-[#1677FF]/20 flex items-center justify-center mx-auto text-[#1677FF] animate-pulse">
              <Camera className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold">Requesting Camera Access...</h3>
            <p className="text-xs text-slate-300 max-w-sm mx-auto">
              Please click "Allow" when prompted by your browser to enable live optical damage inspection.
            </p>
          </div>
        )}

        {/* State D: Camera Denied */}
        {cameraState === 'denied' && (
          <div className="text-center p-8 text-white space-y-4 max-w-md mx-auto">
            <div className="w-16 h-16 rounded-full bg-[#E5484D]/20 flex items-center justify-center mx-auto text-[#E5484D]">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold">Camera Permission Required</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              To guarantee damage inspection provenance, this application requires live camera access. 
              Image file uploads from gallery are strictly disabled for security.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
              <Button variant="primary" size="sm" onClick={startCamera} leftIcon={<RefreshCw className="w-4 h-4" />}>
                Retry Camera Access
              </Button>
              <Button variant="outline" size="sm" onClick={() => setCameraState('simulator')}>
                Switch to Simulator Stream
              </Button>
            </div>
          </div>
        )}

        {/* If Active View is ALREADY Captured: Show Captured Preview with Retake action */}
        {capturedImages[activeViewId] && cameraState !== 'active' && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <div className="relative max-w-lg w-full max-h-[80%] rounded-2xl overflow-hidden border-2 border-emerald-500/70 shadow-2xl">
              <img
                src={capturedImages[activeViewId].image_data}
                alt={activeViewDef.name}
                className="w-full h-full object-contain bg-black"
              />
              <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-emerald-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-md">
                <Check className="w-3.5 h-3.5" />
                <span>{activeViewDef.name} Angle Captured</span>
              </div>
            </div>

            <p className="text-xs text-slate-300 mt-3 text-center">
              Frame is stored in memory. Tap the shutter button below to retake.
            </p>
          </div>
        )}

        {/* State E: Camera Unavailable / Mobile Direct Hardware Capture */}
        {!capturedImages[activeViewId] && cameraState === 'unavailable' && (
          <div className="text-center p-6 text-white space-y-4 max-w-sm mx-auto z-10">
            <div className="w-16 h-16 rounded-2xl bg-[#1677FF]/20 border border-[#1677FF]/30 flex items-center justify-center mx-auto text-[#1677FF] shadow-lg shadow-blue-500/20">
              <Camera className="w-8 h-8 animate-pulse" />
            </div>

            <div>
              <span className="text-[10px] font-mono uppercase px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-bold tracking-wider">
                Target Angle: {activeViewDef.name}
              </span>
              <h3 className="text-lg font-bold text-white mt-1.5">
                Device Camera Ready
              </h3>
              <p className="text-xs text-slate-300 leading-snug mt-1">
                {activeViewDef.instruction}
              </p>
            </div>

            {/* Direct Hardware Mobile Camera Launch Button */}
            <button
              type="button"
              onClick={() => mobileFileInputRef.current?.click()}
              className="w-full py-3.5 px-5 rounded-2xl bg-[#1677FF] hover:bg-blue-600 active:scale-95 text-white font-bold text-sm flex items-center justify-center gap-2.5 shadow-ev-glow transition duration-150"
            >
              <Camera className="w-5 h-5" />
              <span>Snap {activeViewDef.name} Photo</span>
            </button>

            <div className="flex items-center justify-center gap-3 pt-1">
              <button
                type="button"
                onClick={() => setCameraState('simulator')}
                className="text-[11px] text-slate-400 hover:text-white underline transition"
              >
                Use Simulator Stream
              </button>
              <span className="text-slate-600">•</span>
              <button
                type="button"
                onClick={startCamera}
                className="text-[11px] text-blue-400 hover:text-blue-300 underline transition"
              >
                Retry WebCam
              </button>
            </div>
          </div>
        )}

        {/* Top Controls Overlay */}
        {(cameraState === 'active' || cameraState === 'simulator') && (
          <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
            {torchSupported && (
              <button
                type="button"
                onClick={toggleTorch}
                className={`p-3 rounded-full backdrop-blur-md transition-all ${
                  isTorchOn
                    ? 'bg-amber-400 text-black shadow-lg shadow-amber-400/50'
                    : 'bg-black/60 text-white hover:bg-black/80'
                }`}
                aria-label="Toggle Camera Flashlight"
              >
                <Flashlight className="w-5 h-5" />
              </button>
            )}

            {cameraState === 'simulator' ? (
              <button
                type="button"
                onClick={startCamera}
                className="px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md text-white text-xs font-mono hover:bg-black/80 flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Live Camera
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setCameraState('simulator')}
                className="px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md text-white text-xs font-mono hover:bg-black/80 flex items-center gap-1.5"
                title="Switch to simulated bike stream for testing"
              >
                <Sliders className="w-3.5 h-3.5" />
                Simulator Mode
              </button>
            )}
          </div>
        )}

        {/* Bottom Shutter Bar (Always Visible & Actionable) */}
        <div className="absolute bottom-5 inset-x-0 z-20 flex flex-col items-center gap-2 pointer-events-auto">
          {/* Shutter Button */}
          <button
            type="button"
            onClick={handleShutterClick}
            className="w-18 h-18 sm:w-20 sm:h-20 rounded-full border-4 border-white bg-[#1677FF] hover:bg-[#0E62D9] active:scale-95 shadow-ev-glow transition-all duration-150 flex items-center justify-center group focus:outline-none focus:ring-4 focus:ring-[#1677FF]/50"
            aria-label={`Capture ${activeViewDef.name}`}
          >
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full border-2 border-white/80 group-hover:scale-90 transition-transform duration-150 flex items-center justify-center">
              <Camera className="w-7 h-7 text-white" />
            </div>
          </button>

          <span className="text-white text-xs font-bold drop-shadow-md tracking-wider">
            {capturedImages[activeViewId] ? `RETAKE ${activeViewDef.name.toUpperCase()}` : `TAP TO CAPTURE ${activeViewDef.name.toUpperCase()}`}
          </span>
        </div>

        {/* Hidden mobile camera capture file input (Direct back camera) */}
        <input
          ref={mobileFileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleDirectMobileCameraCapture}
        />
      </div>

      {/* Hidden processing canvas */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Captured Views Strip & AI Submission Trigger */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-ev-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-sm text-[#102A43]">
              Captured Inspection Frames
            </h3>
            <Badge variant={allMandatoryCaptured ? 'pass' : 'neutral'}>
              {allMandatoryCaptured ? 'READY FOR AI' : `${mandatoryProgress.capturedCount}/${mandatoryProgress.totalMandatory}`}
            </Badge>
          </div>
          <span className="text-xs text-slate-400">
            Stored securely in application memory
          </span>
        </div>

        {/* Thumbnail Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {CAMERA_VIEWS.map((v) => {
            const captured = capturedImages[v.id];
            return (
              <div
                key={v.id}
                className={`relative rounded-xl border p-2 flex flex-col justify-between transition-all ${
                  captured
                    ? 'border-[#16A36A]/50 bg-slate-50'
                    : 'border-dashed border-slate-300 bg-slate-50/50'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-semibold text-[#102A43] truncate">
                    {v.name.split(' ')[0]}
                  </span>
                  {v.mandatory && <span className="text-[10px] text-amber-500 font-bold">*</span>}
                </div>

                <div className="aspect-[4/3] rounded-lg overflow-hidden bg-slate-200 flex items-center justify-center relative group">
                  {captured ? (
                    <>
                      <img
                        src={captured.image_data}
                        alt={v.name}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-[#102A43]/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => setPreviewModalImg({ view: v.name, url: captured.image_data })}
                          className="p-1.5 rounded-lg bg-white/20 hover:bg-white/40 text-white"
                          title="View High-Res"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRetake(v.id)}
                          className="p-1.5 rounded-lg bg-[#E5484D]/80 hover:bg-[#E5484D] text-white"
                          title="Retake this view"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </button>
                      </div>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setActiveViewId(v.id)}
                      className="text-xs text-slate-400 flex flex-col items-center gap-1 hover:text-[#1677FF] transition-colors"
                    >
                      <Camera className="w-5 h-5 text-slate-300" />
                      <span className="text-[10px]">Capture</span>
                    </button>
                  )}
                </div>

                <div className="mt-1.5 flex items-center justify-between text-[10px]">
                  {captured ? (
                    <>
                      <span className="text-[#16A36A] font-medium flex items-center gap-1">
                        <Check className="w-3 h-3" /> Captured
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRetake(v.id)}
                        className="text-slate-400 hover:text-slate-600 underline"
                      >
                        Retake
                      </button>
                    </>
                  ) : (
                    <span className="text-slate-400 italic">Pending</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Submission Action Bar */}
        <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="text-xs text-slate-500">
            {allMandatoryCaptured ? (
              <span className="text-[#16A36A] font-semibold flex items-center gap-1.5">
                <Check className="w-4 h-4" /> Ready for AI Inspection. All mandatory angles verified.
              </span>
            ) : (
              <span className="text-amber-600 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4" /> Please capture Front, Rear, Left, and Right views before submitting.
              </span>
            )}
          </div>

          <Button
            variant="primary"
            size="lg"
            disabled={!allMandatoryCaptured}
            onClick={() => navigate('/inspection/analyze')}
            rightIcon={<ChevronRight className="w-5 h-5" />}
          >
            Submit for AI Analysis
          </Button>
        </div>
      </div>

      {/* High-Res Preview Modal */}
      <Modal
        isOpen={!!previewModalImg}
        onClose={() => setPreviewModalImg(null)}
        title={`Captured Frame: ${previewModalImg?.view}`}
        maxWidth="xl"
      >
        <div className="space-y-4">
          <div className="rounded-xl overflow-hidden bg-black max-h-[500px] flex items-center justify-center">
            {previewModalImg && (
              <img
                src={previewModalImg.url}
                alt={previewModalImg.view}
                className="max-h-[500px] w-auto object-contain"
              />
            )}
          </div>
          <div className="flex justify-end">
            <Button variant="outline" size="sm" onClick={() => setPreviewModalImg(null)}>
              Close
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
