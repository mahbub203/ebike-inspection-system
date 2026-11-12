import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  FileCheck2, 
  CheckCircle2, 
  Lock, 
  User, 
  Mail, 
  Phone, 
  CreditCard, 
  Clock, 
  ArrowLeft, 
  Printer, 
  ShieldCheck,
  AlertTriangle
} from 'lucide-react';
import { api } from '../services/api';
import { InspectionRecord, ContractRecord } from '../types';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';

export const ContractSubmissionPage: React.FC = () => {
  const { inspectionId } = useParams<{ inspectionId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [inspection, setInspection] = useState<InspectionRecord | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [confirmedContract, setConfirmedContract] = useState<ContractRecord | null>(null);

  // Form Fields initialized with Bangladesh user data
  const [customerName, setCustomerName] = useState<string>(user?.name || 'Tanvir Ahmed');
  const [customerEmail, setCustomerEmail] = useState<string>(user?.email || 'user@glafit.bd');
  const [customerPhone, setCustomerPhone] = useState<string>(user?.phone || '01711223344');
  const [idType, setIdType] = useState<string>('national_id');
  const [idNumber, setIdNumber] = useState<string>(user?.nid_number || '19942691234567890');
  const [durationHours, setDurationHours] = useState<number>(24);
  const [paymentMethod, setPaymentMethod] = useState<string>('bkash');
  const [agreeTerms, setAgreeTerms] = useState<boolean>(true);

  useEffect(() => {
    if (!inspectionId) return;
    let mounted = true;
    setLoading(true);
    setErrorMessage('');

    api.getInspection(inspectionId)
      .then((record) => {
        if (mounted) {
          setInspection(record);
          // Check if contract already exists for this inspection
          if (record.contract_submitted && record.contract_id) {
            api.getContract(record.contract_id).then((c) => {
              if (mounted) setConfirmedContract(c);
            });
          }
          setLoading(false);
        }
      })
      .catch((err) => {
        if (mounted) {
          setErrorMessage(err.detail || 'Could not load inspection record.');
          setLoading(false);
        }
      });

    return () => { mounted = false; };
  }, [inspectionId]);

  // Keep customer name/info updated if auth user loads
  useEffect(() => {
    if (user) {
      setCustomerName(user.name);
      setCustomerEmail(user.email);
      setCustomerPhone(user.phone);
      if (user.nid_number) setIdNumber(user.nid_number);
    }
  }, [user]);

  const handleSubmitContract = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inspection) return;

    // Strict client-side check as well
    if (inspection.status !== 'PASS' || !inspection.allowed_to_proceed_contract) {
      setErrorMessage("You cannot submit the bike contract. Please visit the nearest hub or office for further inspection.");
      return;
    }

    if (!agreeTerms) {
      setErrorMessage("Please accept the Glafit Electric Bike Rental Terms & Conditions.");
      return;
    }

    setSubmitting(true);
    setErrorMessage('');

    try {
      const contract = await api.submitContract({
        inspection_id: inspection.inspection_id,
        bike_id: inspection.bike_id,
        customer_name: customerName,
        customer_email: customerEmail,
        customer_phone: customerPhone,
        customer_id_type: idType,
        customer_id_number: idNumber,
        hub_id: inspection.hub_id,
        rental_duration_hours: durationHours,
        payment_method: paymentMethod,
        agree_terms: true
      });

      setConfirmedContract(contract);
    } catch (err: any) {
      setErrorMessage(err.detail || err.message || 'Failed to submit rental contract.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto py-20 text-center space-y-3">
        <div className="w-12 h-12 rounded-xl bg-[#102A43] text-white flex items-center justify-center mx-auto animate-pulse">
          <FileCheck2 className="w-6 h-6" />
        </div>
        <p className="text-xs text-slate-500 font-mono">Verifying Inspection Gate Clearance...</p>
      </div>
    );
  }

  // STRICT BLOCK IF INSPECTION IS NOT PASS
  if (!inspection || inspection.status !== 'PASS' || !inspection.allowed_to_proceed_contract) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-6 animate-fadeIn">
        <div className="w-20 h-20 rounded-3xl bg-[#E5484D]/10 border-2 border-[#E5484D]/40 text-[#E5484D] flex items-center justify-center mx-auto shadow-sm">
          <Lock className="w-10 h-10" />
        </div>

        <div className="space-y-3">
          <Badge variant="fail" size="lg">CONTRACT SUBMISSION PROHIBITED</Badge>
          <h2 className="text-2xl font-extrabold text-[#102A43]">
            Access Denied
          </h2>
          <div className="p-5 rounded-2xl bg-[#E5484D]/10 border border-[#E5484D]/30 text-left space-y-2">
            <p className="font-bold text-sm text-[#E5484D]">
              You cannot submit the bike contract. Please visit the nearest hub or office for further inspection.
            </p>
            <p className="text-xs text-slate-600">
              Only bikes with an authorized PASS inspection result can proceed to contract submission.
            </p>
          </div>
        </div>

        <div className="flex justify-center gap-3 pt-2">
          <Button variant="outline" size="md" onClick={() => navigate('/')}>
            Return to Dashboard
          </Button>
          {inspection && (
            <Button variant="secondary" size="md" onClick={() => navigate(`/inspection/result/${inspection.inspection_id}`)}>
              View Inspection Report
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fadeIn">
      
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-ev-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Badge variant="pass">PASSED INSPECTION APPROVED</Badge>
            <span className="text-xs font-mono text-slate-400">
              REF: {inspection.inspection_id}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#102A43] tracking-tight">
            Rental Contract Submission
          </h1>
          <p className="text-xs text-slate-500">
            GLAFIT Bangladesh Smart Mobility Agreement & Key Handover
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate(`/inspection/result/${inspection.inspection_id}`)}
          leftIcon={<ArrowLeft className="w-4 h-4" />}
        >
          Inspection Report
        </Button>
      </div>

      {/* State A: Contract already submitted & confirmed! */}
      {confirmedContract ? (
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-[#16A36A]/40 shadow-ev-md space-y-6 animate-fadeIn">
          <div className="flex items-center gap-4 border-b border-slate-100 pb-6">
            <div className="w-14 h-14 rounded-2xl bg-[#16A36A]/10 text-[#16A36A] flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <span className="text-xs font-mono font-bold text-[#16A36A]">
                CONTRACT CONFIRMED & ISSUED
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-[#102A43]">
                Rental Contract #{confirmedContract.contract_id}
              </h2>
              <p className="text-xs text-slate-500">
                Customer copy registered in Glafit Bangladesh fleet ledger.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
            {/* QR Unlock Code */}
            <div className="md:col-span-5 flex flex-col items-center justify-center p-6 bg-slate-50 rounded-2xl border border-slate-200 text-center space-y-3">
              <div className="p-3 bg-white rounded-2xl shadow-sm border border-slate-200">
                <div className="w-40 h-40 bg-[#102A43] rounded-xl p-2 flex items-center justify-center relative">
                  <div className="w-full h-full border-4 border-white flex flex-col justify-between p-2">
                    <div className="flex justify-between">
                      <div className="w-6 h-6 border-4 border-white bg-[#1677FF]" />
                      <div className="w-6 h-6 border-4 border-white bg-[#1677FF]" />
                    </div>
                    <div className="text-center font-mono font-bold text-[9px] text-white">
                      GLAFIT-UNLOCK
                    </div>
                    <div className="flex justify-between">
                      <div className="w-6 h-6 border-4 border-white bg-[#1677FF]" />
                      <div className="w-4 h-4 bg-white" />
                    </div>
                  </div>
                </div>
              </div>
              <span className="text-xs font-mono font-bold text-[#102A43]">
                SCAN AT HUB SMART DOCK
              </span>
              <p className="text-[11px] text-slate-500">
                Present this QR code or Contract ID at {confirmedContract.hub_name} to unlock bike ignition.
              </p>
            </div>

            {/* Contract Ledger Details */}
            <div className="md:col-span-7 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-slate-400 block text-[10px]">VEHICLE</span>
                  <span className="font-bold text-[#102A43] text-sm font-mono">{confirmedContract.bike_id}</span>
                  <span className="text-[11px] text-slate-500 block truncate">{confirmedContract.bike_model}</span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-slate-400 block text-[10px]">CUSTOMER NAME</span>
                  <span className="font-bold text-[#102A43] text-sm">{confirmedContract.customer_name}</span>
                  <span className="text-[11px] text-slate-500 font-mono block">ID: {confirmedContract.customer_id_masked}</span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-slate-400 block text-[10px]">RETURN DUE TIME</span>
                  <span className="font-bold text-[#102A43] text-sm font-mono">{confirmedContract.return_due_time}</span>
                  <span className="text-[11px] text-slate-500 block">Duration: {confirmedContract.rental_duration_hours} hours</span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-slate-400 block text-[10px]">RENTAL STATION</span>
                  <span className="font-bold text-[#102A43] text-sm truncate block">{confirmedContract.hub_name}</span>
                  <span className="text-[11px] text-slate-500 block">Payment: {confirmedContract.payment_method.toUpperCase()}</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#16A36A]/10 border border-[#16A36A]/20 text-[#16A36A] font-medium flex items-center justify-between">
                <span>Total Fee Paid: ৳{confirmedContract.rental_fee_bdt} (Deposit: ৳{confirmedContract.deposit_amount_bdt})</span>
                <span className="font-bold">STATUS: CONFIRMED</span>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100 flex flex-wrap justify-between gap-4">
            <Button
              variant="outline"
              size="md"
              onClick={() => window.print()}
              leftIcon={<Printer className="w-4 h-4" />}
            >
              Print Contract Slip
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={() => navigate('/')}
            >
              Complete & Return to Dashboard
            </Button>
          </div>
        </div>
      ) : (
        /* State B: Contract Form */
        <form onSubmit={handleSubmitContract} className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-ev-sm space-y-6">
          
          {/* Linked Inspection Verification Strip */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs font-mono">
            <div>
              <span className="text-slate-400 block text-[10px]">LINKED AI INSPECTION AUDIT</span>
              <span className="font-bold text-[#102A43] text-sm">{inspection.inspection_id}</span>
              <span className="text-slate-500 block font-sans">Timestamp: {inspection.created_at}</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-[#102A43] font-sans">
                {inspection.bike_model} [{inspection.bike_id}]
              </span>
              <Badge variant="pass">PASSED</Badge>
            </div>
          </div>

          {/* Form Fields: Customer Information */}
          <div className="space-y-4">
            <h3 className="font-bold text-sm text-[#102A43] uppercase tracking-wider flex items-center gap-2">
              <User className="w-4 h-4 text-[#1677FF]" />
              Customer Information
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[#102A43]">
                  Full Name <span className="text-[#E5484D]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#1677FF] text-sm text-[#102A43] min-h-[44px]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[#102A43]">
                  Contact Phone (+880) <span className="text-[#E5484D]">*</span>
                </label>
                <input
                  type="tel"
                  required
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#1677FF] text-sm text-[#102A43] font-mono min-h-[44px]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[#102A43]">
                  Email Address <span className="text-[#E5484D]">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#1677FF] text-sm text-[#102A43] min-h-[44px]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[#102A43]">
                  Official Identity Document <span className="text-[#E5484D]">*</span>
                </label>
                <select
                  value={idType}
                  onChange={(e) => setIdType(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#1677FF] text-sm text-[#102A43] bg-white min-h-[44px]"
                >
                  <option value="national_id">Bangladeshi National ID (Smart Card / NID)</option>
                  <option value="driving_license">BRTA Driving License</option>
                  <option value="passport">Bangladesh Passport</option>
                </select>
              </div>

              <div className="sm:col-span-2 space-y-1.5">
                <label className="block text-xs font-semibold text-[#102A43]">
                  Identity Document Number (NID / License) <span className="text-[#E5484D]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={idNumber}
                  onChange={(e) => setIdNumber(e.target.value)}
                  placeholder="e.g. 19942691234567890"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#1677FF] text-sm text-[#102A43] font-mono min-h-[44px]"
                />
                <span className="text-[10px] text-slate-400 block">
                  Encrypted & masked in backend compliance storage in accordance with digital security standards.
                </span>
              </div>
            </div>
          </div>

          {/* Rental Duration & Payment */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <h3 className="font-bold text-sm text-[#102A43] uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#1677FF]" />
              Rental Plan & Payment Method (Bangladesh Taka)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[#102A43]">
                  Rental Duration
                </label>
                <select
                  value={durationHours}
                  onChange={(e) => setDurationHours(Number(e.target.value))}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#1677FF] text-sm text-[#102A43] bg-white min-h-[44px]"
                >
                  <option value={6}>6 Hours Quick Commute (৳250)</option>
                  <option value={12}>12 Hours Day Pass (৳350)</option>
                  <option value={24}>24 Hours Standard Rental (৳450)</option>
                  <option value={48}>48 Hours Weekend Cruiser (৳800)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[#102A43]">
                  Payment Method
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#1677FF] text-sm text-[#102A43] bg-white min-h-[44px]"
                >
                  <option value="bkash">bKash Mobile Payment</option>
                  <option value="nagad">Nagad Digital Wallet</option>
                  <option value="card">Visa / Mastercard / Amex</option>
                  <option value="cash">Cash Payment at Hub Counter</option>
                </select>
              </div>
            </div>
          </div>

          {/* Terms Agreement */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
                className="mt-1 w-4 h-4 text-[#1677FF] rounded border-slate-300 focus:ring-[#1677FF]"
              />
              <span className="text-xs text-slate-700 leading-relaxed">
                I hereby confirm the pre-rental optical AI inspection report for vehicle <strong>{inspection.bike_id}</strong>, agree to observe Bangladesh traffic regulations, wear a safety helmet, and return the vehicle in the inspected condition.
              </span>
            </label>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="p-4 rounded-xl bg-[#E5484D]/10 border border-[#E5484D]/30 text-[#E5484D] text-xs font-semibold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Submit Button */}
          <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <span className="text-xs text-slate-500 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-[#16A36A]" />
              Inspection clearance verified by backend cryptographic gate.
            </span>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={submitting}
              className="font-bold text-base px-8 py-4 shadow-ev-glow"
            >
              Confirm & Submit Contract
            </Button>
          </div>
        </form>
      )}
    </div>
  );
};
