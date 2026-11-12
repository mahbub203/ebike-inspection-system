import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  History, 
  Search, 
  Clock, 
  ChevronRight, 
  Eye, 
  ArrowRight,
  MapPin,
  RefreshCw
} from 'lucide-react';
import { api } from '../services/api';
import { InspectionRecord } from '../types';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { DetectionResults } from '../components/inspection/DetectionResults';

export const InspectionHistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const [inspections, setInspections] = useState<InspectionRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedInspection, setSelectedInspection] = useState<InspectionRecord | null>(null);

  const fetchHistory = () => {
    setLoading(true);
    api.getInspections(statusFilter, searchQuery)
      .then((res) => {
        setInspections(res);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load history:', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchHistory();
  }, [statusFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchHistory();
  };

  const filterTabs = [
    { id: 'ALL', label: 'All Audits' },
    { id: 'PASS', label: 'Successful' },
    { id: 'FAIL', label: 'Failed' },
    { id: 'MANUAL_REVIEW', label: 'Manual Review' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fadeIn">
      
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-ev-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono font-bold bg-[#102A43] text-white px-2.5 py-0.5 rounded-lg">
              FLEET AUDIT LOG
            </span>
            <span className="text-xs text-slate-500 font-medium">
              Inspection Registry & Verification Trace
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#102A43] tracking-tight">
            Inspection History
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Immutable AI damage inspection records, bounding boxes, and linked rental contracts.
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          onClick={() => navigate('/new-inspection')}
          className="font-bold flex-shrink-0"
        >
          New Inspection
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200/90 shadow-ev-sm space-y-4">
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-stretch sm:items-center">
          
          {/* Filter Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {filterTabs.map((tab) => {
              const isActive = statusFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setStatusFilter(tab.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-medium transition-all min-h-[40px] flex items-center gap-1.5 flex-shrink-0 ${
                    isActive
                      ? 'bg-[#102A43] text-white shadow-sm'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Search Form */}
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search Bike ID (e.g. BD-GLF-101)..."
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-[#1677FF] min-h-[40px]"
              />
            </div>
            <Button type="submit" variant="secondary" size="sm" className="min-h-[40px]">
              Search
            </Button>
          </form>
        </div>
      </div>

      {/* History Table / Card List */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-ev-sm overflow-hidden">
        {loading ? (
          <div className="p-16 text-center text-slate-400 space-y-2">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-[#1677FF]" />
            <p className="text-xs">Loading inspection ledger...</p>
          </div>
        ) : inspections.length === 0 ? (
          <div className="p-16 text-center text-slate-400 space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
              <History className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-[#102A43]">No Inspection Records in Ledger</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Real audit logs and AI defect bounding boxes appear here in real-time as users inspect bikes.
            </p>
            <div className="pt-2">
              <Button variant="primary" size="sm" onClick={() => navigate('/new-inspection')}>
                Start First Bike Inspection
              </Button>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {inspections.map((item) => (
              <div
                key={item.inspection_id}
                className="p-5 hover:bg-slate-50/80 transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-4"
              >
                {/* Left Block: Status, ID, Bike Info */}
                <div className="flex items-start gap-4">
                  <div className="mt-1 flex-shrink-0">
                    <Badge status={item.status} size="md">
                      {item.status}
                    </Badge>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-base text-[#102A43]">
                        {item.bike_id}
                      </span>
                      <span className="text-xs text-slate-500 font-mono">
                        [{item.inspection_id}]
                      </span>
                      {item.contract_submitted && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#16A36A]/10 text-[#16A36A] font-semibold border border-[#16A36A]/20">
                          CONTRACTED
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 font-medium">
                      {item.bike_model} • {item.inspection_type.replace('_', ' ').toUpperCase()}
                    </p>
                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 font-mono pt-0.5">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" /> {item.created_at}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400" /> {item.hub_name}
                      </span>
                      <span>•</span>
                      <span>Inspector: {item.inspector_name}</span>
                    </div>
                  </div>
                </div>

                {/* Right Block: Telemetry & Actions */}
                <div className="flex items-center justify-between lg:justify-end gap-4 border-t lg:border-t-0 pt-3 lg:pt-0">
                  <div className="text-right text-xs">
                    <span className="font-mono font-bold text-[#102A43] block">
                      {item.detections_count === 0 ? '0 Defects' : `${item.detections_count} Anomaly Detections`}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {item.images_analyzed_count} Angles Analyzed
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedInspection(item)}
                      leftIcon={<Eye className="w-3.5 h-3.5" />}
                    >
                      Audit View
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => navigate(`/inspection/result/${item.inspection_id}`)}
                      rightIcon={<ChevronRight className="w-3.5 h-3.5" />}
                    >
                      Report
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Inspection Detail Modal */}
      <Modal
        isOpen={!!selectedInspection}
        onClose={() => setSelectedInspection(null)}
        title={selectedInspection ? `Inspection Audit: ${selectedInspection.inspection_id}` : ''}
        subtitle={selectedInspection ? `${selectedInspection.bike_model} [${selectedInspection.bike_id}]` : ''}
        maxWidth="full"
      >
        {selectedInspection && (
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-2">
                <Badge status={selectedInspection.status} size="lg">
                  {selectedInspection.status}
                </Badge>
              </div>
              <span className="text-xs text-slate-500 font-mono">
                Analyzed at: {selectedInspection.created_at}
              </span>
            </div>

            <DetectionResults inspection={selectedInspection} />

            <div className="flex justify-between items-center pt-4 border-t border-slate-100">
              <Button variant="outline" size="sm" onClick={() => setSelectedInspection(null)}>
                Close
              </Button>

              {selectedInspection.status === 'PASS' && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    navigate(`/contract/submit/${selectedInspection.inspection_id}`);
                  }}
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  Go to Contract
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
