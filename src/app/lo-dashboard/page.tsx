"use client";

import React, { useState, useEffect } from 'react';
import { X, User, Mail, Phone, Calendar, MapPin, AlertCircle, LogOut, FileText, IdCard, ExternalLink, Package } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { getImageUrl, getPaymentProofUrl } from '../../lib/imageUrl';

const TABS = [
  { key: 'pending', label: 'Pending', status: 'pending', color: 'yellow' },
  { key: 'confirmed', label: 'Confirmed', status: 'confirmed', color: 'green' },
  { key: 'declined', label: 'Declined', status: 'declined', color: 'red' },
];

const TYPE_FILTERS = [
  { key: 'all', label: 'All Types' },
  { key: 'individual', label: 'Individual' },
  { key: 'community', label: 'Community' },
  { key: 'family', label: 'Family Bundle' },
];

interface RegistrationDetail {
  registrationId: number;
  registrationType: string;
  totalAmount: number;
  groupName?: string;
  participantCount: number;
  createdAt: string;
  user?: {
    idCardPhoto?: string;
  };
}

interface PaymentDetail {
  registrationId: number;
  registrationIds?: number[];
  transactionId?: string;
  userName: string;
  email: string;
  phone: string;
  registrationType: string;
  groupName?: string;
  totalAmount: number;
  createdAt: string;
  paymentStatus: string;
  participantCount: number;
  categoryCounts?: Record<string, number>;
  jerseySizes?: Record<string, number>;
  payments: Array<{
    id: number;
    amount: number;
    proofOfPayment?: string;
    status?: string;
    transactionId?: string;
    registrationId?: number;
    proofSenderName?: string;
  }>;
  user?: {
    birthDate?: string;
    gender?: string;
    currentAddress?: string;
    nationality?: string;
    emergencyPhone?: string;
    medicalHistory?: string;
    idCardPhoto?: string;
  };
  registrations?: RegistrationDetail[];
}

interface StatusCounts {
  pending: number;
  confirmed: number;
  declined: number;
}

// Helper to detect file type
function getFileType(path?: string): 'pdf' | 'image' | 'unknown' {
  if (!path) return 'unknown';
  const lower = path.toLowerCase();
  if (lower.endsWith('.pdf')) return 'pdf';
  if (lower.match(/\.(jpg|jpeg|png|gif|webp|bmp)$/)) return 'image';
  if (lower.includes('/pdf/') || lower.includes('pdf')) return 'pdf';
  return 'image';
}

// FileDisplay component for showing images or PDF links
function FileDisplay({ 
  src, 
  originalPath, 
  alt, 
  label, 
  imageClassName 
}: { 
  src: string; 
  originalPath?: string; 
  alt: string; 
  label: string; 
  imageClassName?: string;
}) {
  const fileType = getFileType(originalPath);
  
  if (fileType === 'pdf') {
    return (
      <div className="flex flex-col items-center gap-2">
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
          <FileText size={48} className="text-red-400" />
        </div>
        <p className="text-sm text-[#ffdfc0]/80">{label}</p>
        <a
          href={src}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-2 px-4 py-2 bg-[#73e9dd]/20 border border-[#73e9dd]/50 text-[#73e9dd] rounded-lg hover:bg-[#73e9dd]/30 transition-all"
        >
          <ExternalLink size={16} />
          Open PDF
        </a>
      </div>
    );
  }
  
  return (
    <a href={src} target="_blank" rel="noreferrer">
      <img
        src={src}
        alt={alt}
        className={imageClassName}
        onError={(e) => {
          console.error('Image load failed:', src);
          (e.target as HTMLImageElement).style.display = 'none';
        }}
      />
    </a>
  );
}

// InfoItem component for displaying labeled information
function InfoItem({ 
  icon, 
  label, 
  value, 
  capitalize, 
  highlight, 
  fullWidth 
}: { 
  icon?: React.ReactNode; 
  label: string; 
  value?: string; 
  capitalize?: boolean; 
  highlight?: boolean; 
  fullWidth?: boolean;
}) {
  if (!value) return null;
  
  return (
    <div className={`${fullWidth ? 'col-span-full' : ''}`}>
      <div className="flex items-center gap-2 text-[#73e9dd] text-sm mb-1">
        {icon}
        <span>{label}</span>
      </div>
      <p className={`text-[#ffdfc0] ${capitalize ? 'capitalize' : ''} ${highlight ? 'text-lg font-bold text-[#91dcac]' : ''} break-words`}>
        {value}
      </p>
    </div>
  );
}

export default function LODashboard() {
  const router = useRouter();
  const [payments, setPayments] = useState<PaymentDetail[]>([]);
  const [statusCounts, setStatusCounts] = useState<StatusCounts>({
    pending: 0,
    confirmed: 0,
    declined: 0,
  });
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('pending');
  const [typeFilter, setTypeFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<PaymentDetail | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [declineReason, setDeclineReason] = useState("");
  const [showDeclineModal, setShowDeclineModal] = useState(false);
  const [pendingDeclineId, setPendingDeclineId] = useState<number | null>(null);

  useEffect(() => {
    fetchStatusCounts();
  }, []);

  useEffect(() => {
    fetchPayments();
    fetchCounts();
  }, [activeTab]);

  async function fetchStatusCounts() {
    try {
      const res = await fetch('/api/payments/counts', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setStatusCounts(data.counts || { pending: 0, confirmed: 0, declined: 0 });
      }
    } catch (err) {
      console.error('Error fetching status counts:', err);
    }
  }

  async function fetchPayments() {
    setLoading(true);
    setError(null);
    try {
      const url = activeTab === 'all' 
        ? '/api/admin/payments/all'
        : `/api/admin/payments/all?status=${activeTab}`;
      
      console.log('[LODashboard] Fetching from:', url);
      
      const response = await fetch(url, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch payments: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('[LODashboard] Received data:', data);
      
      setPayments(data as PaymentDetail[]);
      
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching payments:', err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchCounts() {
    try {
      const response = await fetch('/api/payments/counts', {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setStatusCounts(data.counts);
      }
    } catch (err) {
      console.error('Error fetching counts:', err);
    }
  }

  async function handleAccept(payment: PaymentDetail) {
    const regCount = payment.registrationIds?.length || 1;
    if (!confirm(`Confirm payment for transaction ${payment.transactionId || payment.registrationId}? This will confirm ${regCount} registration(s).`)) return;
    try {
      const regIds = payment.registrationIds && payment.registrationIds.length > 0 ? payment.registrationIds : [payment.registrationId];
      for (const regId of regIds) {
        const res = await fetch('/api/payments/confirm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ registrationId: regId }),
        });
        const body = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(body?.error || body?.message || 'Failed to confirm registration ' + regId);
      }
      alert(`All ${regCount} registration(s) in transaction confirmed. QR codes will be sent.`);
      fetchPayments();
      fetchStatusCounts();
      setShowDetailsModal(false);
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  }

  async function handleDecline(payment: PaymentDetail) {
    const regCount = payment.registrationIds?.length || 1;
    if (!confirm(`Decline payment for transaction ${payment.transactionId || payment.registrationId}? This will decline ${regCount} registration(s).`)) return;
    try {
      const regIds = payment.registrationIds && payment.registrationIds.length > 0 ? payment.registrationIds : [payment.registrationId];
      for (const regId of regIds) {
        const res = await fetch('/api/payments/decline', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ registrationId: regId, reason: 'Declined by admin' }),
        });
        const body = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(body?.error || body?.message || 'Failed to decline registration ' + regId);
      }
      alert('Transaction declined. Notifications sent.');
      fetchPayments();
      fetchStatusCounts();
      setShowDetailsModal(false);
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  }

  async function confirmDecline() {
    const reason = declineReason?.trim() || 'Declined by admin';
    const regIds: number[] = [];
    if (selectedPayment?.registrationIds && selectedPayment.registrationIds.length > 0) {
      regIds.push(...selectedPayment.registrationIds);
    } else if (pendingDeclineId) {
      regIds.push(pendingDeclineId);
    } else if (selectedPayment?.registrationId) {
      regIds.push(selectedPayment.registrationId);
    }

    if (regIds.length === 0) {
      alert('No registration selected to decline.');
      return;
    }

    try {
      setLoading(true);
      for (const regId of regIds) {
        const res = await fetch('/api/payments/decline', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ registrationId: regId, reason }),
        });
        const body = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(body?.error || body?.message || `Failed to decline registration ${regId}`);
      }
      setShowDeclineModal(false);
      setPendingDeclineId(null);
      setDeclineReason('');
      await fetchPayments();
      await fetchStatusCounts();
      alert('Selected registration(s) declined and notification(s) sent.');
    } catch (err: any) {
      console.error('Decline failed:', err);
      alert('Decline failed: ' + (err?.message || String(err)));
    } finally {
      setLoading(false);
    }
  }

  const handleChangeStatus = async (registrationId: number, newStatus: 'confirmed' | 'declined') => {
    const action = newStatus === 'confirmed' ? 'confirm' : 'decline';
    if (!confirm(`Change payment status to ${newStatus}?`)) return;

    try {
      const res = await fetch(`/api/payments/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ registrationId }),
      });

      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.error || `Failed to ${action}`);

      alert(`Status changed to ${newStatus} successfully!`);
      fetchPayments();
      fetchStatusCounts();
      setShowDetailsModal(false);
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  };

  const handleLogout = async () => {
    if (!confirm('Logout from admin dashboard?')) return;
    
    try {
      await fetch('/api/auth/logout', { 
        method: 'POST', 
        credentials: 'include' 
      });
      
      setPayments([]);
      setSelectedPayment(null);
      setShowDetailsModal(false);
      router.push('/admin/login');
    } catch (error) {
      console.error('Logout error:', error);
      router.push('/admin/login');
    }
  };

  const openDetails = (payment: PaymentDetail) => {
    setSelectedPayment(payment);
    setShowDetailsModal(true);
  };

  const filteredPayments = payments.filter(payment => {
    const matchesType = typeFilter === 'all' || 
      payment.registrationType === typeFilter ||
      payment.registrations?.some(r => r.registrationType === typeFilter);
    const matchesSearch =
      payment.userName.toLowerCase().includes(search.toLowerCase()) ||
      payment.email.toLowerCase().includes(search.toLowerCase()) ||
      (payment.groupName && payment.groupName.toLowerCase().includes(search.toLowerCase())) ||
      payment.registrations?.some(r => r.groupName?.toLowerCase().includes(search.toLowerCase()));
    return matchesType && matchesSearch;
  });

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50',
      confirmed: 'bg-green-500/20 text-green-300 border-green-500/50',
      declined: 'bg-red-500/20 text-red-300 border-red-500/50',
    };
    return styles[status as keyof typeof styles] || styles.pending;
  };

  const getRegistrationTypesDisplay = (payment: PaymentDetail) => {
    if (!payment.registrations || payment.registrations.length <= 1) {
      return payment.registrationType;
    }
    
    const typeCounts: Record<string, number> = {};
    payment.registrations.forEach(r => {
      typeCounts[r.registrationType] = (typeCounts[r.registrationType] || 0) + 1;
    });
    
    return Object.entries(typeCounts)
      .map(([type, count]) => count > 1 ? `${type} (${count})` : type)
      .join(', ');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f1724] via-[#18181b] to-[#0f1724] p-3 sm:p-4 md:p-6 lg:p-8 pt-20 sm:pt-24">
      <div className="max-w-7xl mx-auto pt-16 sm:pt-20">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6 sm:mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#73e9dd] to-[#91dcac]">
              Payment Management
            </h1>
            <p className="text-[#ffdfc0]/60 mt-1 sm:mt-2 text-sm sm:text-base">Manage and review registration payments</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-red-500/20 border border-red-500/50 text-red-300 rounded-lg hover:bg-red-500/30 transition-colors w-full sm:w-auto"
          >
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>

        {/* Status Tabs */}
        <div className="flex flex-wrap gap-2 sm:gap-3 mb-4 sm:mb-6">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 min-w-[100px] sm:flex-initial px-4 sm:px-6 py-2 sm:py-3 rounded-xl font-semibold transition-all text-sm sm:text-base ${
                activeTab === tab.key
                  ? 'bg-[#73e9dd] text-[#18181b]'
                  : 'bg-[#232326] text-[#ffdfc0] border border-[#73e9dd]/30 hover:border-[#73e9dd]'
              }`}
            >
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">{tab.label.substring(0, 4)}</span>
              <span className="ml-1">({statusCounts[tab.key as keyof StatusCounts] || 0})</span>
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-4 sm:mb-6">
          {TYPE_FILTERS.map((filter) => (
            <button
              key={filter.key}
              onClick={() => setTypeFilter(filter.key)}
              className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                typeFilter === filter.key
                  ? 'bg-[#91dcac] text-[#18181b]'
                  : 'bg-[#232326] text-[#ffdfc0] border border-[#73e9dd]/30 hover:border-[#73e9dd]'
              }`}
            >
              <span className="hidden sm:inline">{filter.label}</span>
              <span className="sm:hidden">{filter.label.split(' ')[0]}</span>
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#73e9dd] border-t-transparent"></div>
          </div>
        ) : error ? (
          <div className="text-center py-20 text-red-400">
            <AlertCircle size={48} className="mx-auto mb-4" />
            <p className="px-4">{error}</p>
          </div>
        ) : (
          <>
            {/* Search */}
            <div className="mb-4 sm:mb-6">
              <input
                type="text"
                placeholder="Search by name, email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-[#232326] border border-[#73e9dd]/30 text-[#ffdfc0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#73e9dd] focus:border-transparent placeholder-[#ffdfc0]/40 text-sm sm:text-base"
              />
            </div>

            {/* Payment Cards */}
            <div className="space-y-3 sm:space-y-4">
              {filteredPayments.length > 0 ? (
                filteredPayments.map((payment) => (
                  <div
                    key={`${payment.transactionId || payment.registrationId}`}
                    className="bg-[#232326] rounded-xl p-4 sm:p-6 border border-[#73e9dd]/20 hover:border-[#73e9dd]/50 transition-all"
                  >
                    <div className="flex flex-col gap-4 mb-4">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <h3 className="text-lg sm:text-xl font-bold text-[#ffdfc0] break-words">{payment.userName}</h3>
                          <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-semibold border ${getStatusBadge(payment.paymentStatus)}`}>
                            {payment.paymentStatus}
                          </span>
                          {payment.registrations && payment.registrations.length > 1 ? (
                            <span className="px-2 sm:px-3 py-1 rounded-full text-xs font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/50">
                              {payment.registrations.length} items
                            </span>
                          ) : (
                            <span className="px-2 sm:px-3 py-1 rounded-full text-xs font-semibold bg-[#73e9dd]/20 text-[#73e9dd] border border-[#73e9dd]/50 capitalize">
                              {payment.registrationType}
                            </span>
                          )}
                        </div>
                        <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 sm:gap-4 text-xs sm:text-sm text-[#ffdfc0]/60">
                          <span className="flex items-center gap-1 break-all">
                            <Mail size={14} className="flex-shrink-0" /> 
                            <span className="truncate">{payment.email}</span>
                          </span>
                          <span className="flex items-center gap-1">
                            <Phone size={14} className="flex-shrink-0" /> {payment.phone}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar size={14} className="flex-shrink-0" /> {new Date(payment.createdAt).toLocaleDateString('id-ID')}
                          </span>
                        </div>

                        {/* Registration breakdown for multiple items */}
                        {payment.registrations && payment.registrations.length > 1 && (
                          <div className="mt-3 p-3 bg-[#18181b] rounded-lg">
                            <div className="text-xs text-[#73e9dd] mb-2 font-semibold flex items-center gap-1">
                              <Package size={14} /> Items:
                            </div>
                            <div className="space-y-1">
                              {payment.registrations.map((reg) => (
                                <div key={reg.registrationId} className="flex flex-col sm:flex-row sm:justify-between gap-1 text-xs sm:text-sm">
                                  <span className="text-[#ffdfc0]/80 break-words">
                                    #{reg.registrationId} - {reg.registrationType}
                                    {reg.groupName && ` (${reg.groupName})`}
                                  </span>
                                  <span className="text-[#91dcac] whitespace-nowrap">
                                    {reg.participantCount}p • Rp {Number(reg.totalAmount).toLocaleString('id-ID')}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div className="text-xl sm:text-2xl font-bold text-[#91dcac]">
                          Rp {Number(payment.totalAmount).toLocaleString('id-ID')}
                        </div>
                        <div className="text-xs sm:text-sm text-[#ffdfc0]/60">
                          {payment.participantCount} participant{payment.participantCount > 1 ? 's' : ''}
                          {payment.registrations && payment.registrations.length > 1 && (
                            <span className="ml-1">• {payment.registrations.length} reg</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Payment proof preview */}
                    <div className="flex flex-wrap gap-2 mb-3 sm:mb-4">
                      {payment.payments?.[0] ? (
                        payment.payments[0].proofOfPayment ? (
                          <>
                            {getFileType(payment.payments[0].proofOfPayment) === 'pdf' ? (
                              <a
                                href={getPaymentProofUrl(payment.payments[0].id)}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-[#73e9dd]/10 border border-[#73e9dd]/30 text-[#73e9dd] rounded-lg hover:bg-[#73e9dd]/20 transition-all text-xs sm:text-sm"
                              >
                                <FileText size={16} />
                                <span className="hidden sm:inline">View Proof (PDF)</span>
                                <span className="sm:hidden">PDF</span>
                              </a>
                            ) : (
                              <a
                                href={getPaymentProofUrl(payment.payments[0].id)}
                                target="_blank"
                                rel="noreferrer"
                                className="flex-shrink-0"
                              >
                                <img
                                  src={getPaymentProofUrl(payment.payments[0].id)}
                                  alt="Payment proof"
                                  className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-lg border-2 border-[#73e9dd]/30 hover:border-[#73e9dd] transition-all"
                                  onError={(e) => {
                                    console.error('Image load failed for payment ID:', payment.payments[0].id);
                                    (e.target as HTMLImageElement).style.display = 'none';
                                  }}
                                />
                              </a>
                            )}
                          </>
                        ) : (
                          <span className="text-yellow-400 text-xs sm:text-sm">No proof uploaded</span>
                        )
                      ) : (
                        <span className="text-gray-500 text-xs sm:text-sm">No payment record</span>
                      )}
                    </div>

                    {/* Categories and Jersey Sizes */}
                    {payment.categoryCounts && Object.entries(payment.categoryCounts).length > 0 && (
                      <div className="bg-[#18181b] rounded-lg p-3 mb-3">
                        <div className="text-xs text-[#73e9dd] mb-2 font-semibold">Categories:</div>
                        <div className="flex flex-wrap gap-1.5 sm:gap-2">
                          {Object.entries(payment.categoryCounts).map(([cat, count]) => (
                            <span key={cat} className="px-2 py-1 bg-[#73e9dd]/10 text-[#73e9dd] rounded text-xs">
                              {cat}: {String(count)}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {payment.jerseySizes && Object.entries(payment.jerseySizes).length > 0 && (
                      <div className="bg-[#18181b] rounded-lg p-3 mb-3">
                        <div className="text-xs text-[#73e9dd] mb-2 font-semibold">Jersey Sizes:</div>
                        <div className="flex flex-wrap gap-1.5 sm:gap-2">
                          {Object.entries(payment.jerseySizes).map(([size, count]) => (
                            <span key={size} className="px-2 py-1 bg-[#91dcac]/10 text-[#91dcac] rounded text-xs">
                              {size}: {String(count)}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Action buttons */}
                    <div className="flex flex-col sm:flex-row flex-wrap gap-2">
                      <button
                        onClick={() => openDetails(payment)}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-[#73e9dd]/20 border border-[#73e9dd]/50 text-[#73e9dd] rounded-lg hover:bg-[#73e9dd]/30 transition-colors text-sm"
                      >
                        <FileText size={16} />
                        Details
                      </button>
                      {activeTab === 'pending' && (
                        <>
                          <button
                            onClick={() => handleAccept(payment)}
                            className="flex-1 sm:flex-initial px-4 py-2 bg-green-500/20 border border-green-500/50 text-green-300 rounded-lg hover:bg-green-500/30 transition-colors font-semibold text-sm"
                          >
                            Accept
                          </button>
                          <button
                            onClick={() => handleDecline(payment)}
                            className="flex-1 sm:flex-initial px-4 py-2 bg-red-500/20 border border-red-500/50 text-red-300 rounded-lg hover:bg-red-500/30 transition-colors font-semibold text-sm"
                          >
                            Decline
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-20 bg-[#232326] rounded-xl border border-[#73e9dd]/20">
                  <div className="text-4xl sm:text-6xl mb-4">📭</div>
                  <p className="text-[#ffdfc0] text-base sm:text-lg px-4">No {activeTab} payments found</p>
                  <p className="text-[#ffdfc0]/60 text-xs sm:text-sm mt-2 px-4">Try adjusting your filters or search query</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Details Modal */}
      {showDetailsModal && selectedPayment && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4 overflow-y-auto">
          <div className="bg-[#232326] rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto border-2 border-[#73e9dd]/30 shadow-2xl my-4">
            {/* Modal Header */}
            <div className="sticky top-0 bg-gradient-to-r from-[#232326] to-[#2a2a2e] p-4 sm:p-6 border-b border-[#73e9dd]/30 flex justify-between items-start gap-3 z-10">
              <div className="flex-1 min-w-0">
                <h2 className="text-xl sm:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#73e9dd] to-[#91dcac]">
                  Transaction Details
                </h2>
                <p className="text-[#ffdfc0]/60 text-xs sm:text-sm mt-1 break-all">
                  Transaction: {selectedPayment.transactionId || `#${selectedPayment.registrationId}`}
                </p>
                {selectedPayment.registrations && selectedPayment.registrations.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {selectedPayment.registrations.map((r) => (
                      <div key={r.registrationId} className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-[#1b1b1d] p-2 rounded gap-1">
                        <div className="text-xs sm:text-sm min-w-0">
                          <div className="font-medium text-[#ffdfc0] break-words">#{r.registrationId} — {r.registrationType}</div>
                          <div className="text-xs text-[#9ca3af]">
                            {r.groupName ? `${r.groupName} • ` : ''}{r.participantCount}p • Rp {Number(r.totalAmount).toLocaleString('id-ID')}
                          </div>
                        </div>
                        <div className="text-xs text-[#9ca3af] whitespace-nowrap">{new Date(r.createdAt).toLocaleDateString('id-ID')}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="p-2 hover:bg-[#18181b] rounded-lg transition-colors flex-shrink-0"
              >
                <X size={24} className="text-[#ffdfc0]" />
              </button>
            </div>

            <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
              {/* Status Badge */}
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <span className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold border ${getStatusBadge(selectedPayment.paymentStatus)}`}>
                  Status: {selectedPayment.paymentStatus.toUpperCase()}
                </span>
                <span className="px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold bg-[#73e9dd]/20 text-[#73e9dd] border border-[#73e9dd]/50 capitalize">
                  {selectedPayment.registrations && selectedPayment.registrations.length > 1 
                    ? `${selectedPayment.registrations.length} registrations`
                    : selectedPayment.registrationType
                  }
                </span>
              </div>

              {/* Personal Information */}
              <div className="bg-[#18181b] rounded-xl p-4 sm:p-6 border border-[#73e9dd]/20">
                <h3 className="text-base sm:text-lg font-semibold text-[#91dcac] mb-3 sm:mb-4 flex items-center gap-2">
                  <User size={20} /> Personal Information
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <InfoItem icon={<User size={16} />} label="Full Name" value={selectedPayment.userName} />
                  <InfoItem icon={<Mail size={16} />} label="Email" value={selectedPayment.email} />
                  <InfoItem icon={<Phone size={16} />} label="Phone" value={selectedPayment.phone} />
                  {selectedPayment.user?.emergencyPhone && (
                    <InfoItem icon={<AlertCircle size={16} />} label="Emergency Contact" value={selectedPayment.user.emergencyPhone} />
                  )}
                  {selectedPayment.user?.birthDate && (
                    <InfoItem 
                      icon={<Calendar size={16} />} 
                      label="Birth Date" 
                      value={new Date(selectedPayment.user.birthDate).toLocaleDateString('id-ID')} 
                    />
                  )}
                  {selectedPayment.user?.gender && (
                    <InfoItem label="Gender" value={selectedPayment.user.gender} capitalize />
                  )}
                  {selectedPayment.user?.nationality && (
                    <InfoItem label="Nationality" value={selectedPayment.user.nationality} />
                  )}
                  {selectedPayment.user?.currentAddress && (
                    <InfoItem 
                      icon={<MapPin size={16} />} 
                      label="Address" 
                      value={selectedPayment.user.currentAddress} 
                      fullWidth 
                    />
                  )}
                  {selectedPayment.user?.medicalHistory && (
                    <InfoItem 
                      label="Medical History" 
                      value={selectedPayment.user.medicalHistory} 
                      fullWidth 
                    />
                  )}
                </div>
              </div>

              {/* ID Card Photos */}
              {selectedPayment.registrations && selectedPayment.registrations.length > 0 && selectedPayment.registrations.some((r:any) => (r.user?.idCardPhoto)) ? (
                <div className="bg-[#18181b] rounded-xl p-4 sm:p-6 border border-[#73e9dd]/20">
                  <h3 className="text-base sm:text-lg font-semibold text-[#91dcac] mb-3 sm:mb-4 flex items-center gap-2">
                    <IdCard size={20} />
                    ID Card(s)
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    {selectedPayment.registrations.map((r: any) => {
                      const img = r.user?.idCardPhoto;
                      if (!img) return null;
                      const imgUrl = getImageUrl(img);
                      const alt = `ID Card — Registration #${r.registrationId}`;
                      
                      return (
                        <div key={r.registrationId}>
                          <FileDisplay 
                            src={imgUrl}
                            originalPath={img}
                            alt={alt}
                            label={`ID Card - Reg #${r.registrationId}`}
                            imageClassName="w-full rounded-lg border-2 border-[#73e9dd]/30 hover:border-[#73e9dd] transition-all cursor-pointer object-cover max-h-60"
                          />
                          <p className="text-xs text-[#ffdfc0]/60 text-center mt-2">Registration #{r.registrationId}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : selectedPayment.user?.idCardPhoto ? (
                <div className="bg-[#18181b] rounded-xl p-4 sm:p-6 border border-[#73e9dd]/20">
                  <h3 className="text-base sm:text-lg font-semibold text-[#91dcac] mb-3 sm:mb-4 flex items-center gap-2">
                    <IdCard size={20} />
                    {selectedPayment.user.nationality === 'WNI' ? 'KTP/ID Card' : 'Passport'}
                  </h3>
                  <FileDisplay 
                    src={getImageUrl(selectedPayment.user.idCardPhoto)}
                    originalPath={selectedPayment.user.idCardPhoto}
                    alt="ID Card"
                    label={selectedPayment.user.nationality === 'WNI' ? 'ID Card Document' : 'Passport Document'}
                    imageClassName="w-full max-w-2xl mx-auto rounded-lg border-2 border-[#73e9dd]/30 hover:border-[#73e9dd] transition-all cursor-pointer"
                  />
                  <p className="text-xs text-[#ffdfc0]/60 text-center mt-2">Click to view full size</p>
                </div>
              ) : null}

              {/* Registration Information */}
              <div className="bg-[#18181b] rounded-xl p-4 sm:p-6 border border-[#73e9dd]/20">
                <h3 className="text-base sm:text-lg font-semibold text-[#91dcac] mb-3 sm:mb-4">Transaction Details</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  {selectedPayment.registrations && selectedPayment.registrations.length > 1 ? (
                    <InfoItem label="Registrations" value={`${selectedPayment.registrations.length} items`} />
                  ) : (
                    <InfoItem label="Registration Type" value={selectedPayment.registrationType} capitalize />
                  )}
                  {selectedPayment.groupName && (
                    <InfoItem label="Group Name" value={selectedPayment.groupName} />
                  )}
                  <InfoItem 
                    label="Total Amount" 
                    value={`Rp ${Number(selectedPayment.totalAmount).toLocaleString('id-ID')}`}
                    highlight 
                  />
                  <InfoItem 
                    label="Total Participants" 
                    value={`${selectedPayment.participantCount} person${selectedPayment.participantCount > 1 ? 's' : ''}`}
                  />
                  <InfoItem 
                    label="Transaction Date" 
                    value={new Date(selectedPayment.createdAt).toLocaleString('id-ID')}
                    fullWidth 
                  />
                </div>

                {selectedPayment.categoryCounts && Object.keys(selectedPayment.categoryCounts).length > 0 && (
                  <div className="mt-4 pt-4 border-t border-[#73e9dd]/20">
                    <div className="text-sm text-[#73e9dd] mb-2 font-semibold">Categories:</div>
                    <div className="flex flex-wrap gap-1.5 sm:gap-2">
                      {Object.entries(selectedPayment.categoryCounts).map(([cat, count]) => (
                        <span key={cat} className="px-2 sm:px-3 py-1 sm:py-1.5 bg-[#73e9dd]/10 text-[#73e9dd] rounded-lg text-xs sm:text-sm border border-[#73e9dd]/30">
                          {cat}: {String(count)}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {selectedPayment.jerseySizes && Object.keys(selectedPayment.jerseySizes).length > 0 && (
                  <div className="mt-4 pt-4 border-t border-[#73e9dd]/20">
                    <div className="text-sm text-[#73e9dd] mb-2 font-semibold">Jersey Sizes:</div>
                    <div className="flex flex-wrap gap-1.5 sm:gap-2">
                      {Object.entries(selectedPayment.jerseySizes).map(([size, count]) => (
                        <span key={size} className="px-2 sm:px-3 py-1 sm:py-1.5 bg-[#91dcac]/10 text-[#91dcac] rounded-lg text-xs sm:text-sm border border-[#91dcac]/30">
                          {size}: {String(count)}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Payment Proof */}
              <div className="bg-[#18181b] rounded-xl p-4 sm:p-6 border border-[#73e9dd]/20">
                <h3 className="text-base sm:text-lg font-semibold text-[#91dcac] mb-3 sm:mb-4">Payment Proof</h3>
                
                {selectedPayment.payments?.[0]?.proofOfPayment ? (
                  <>
                    <FileDisplay 
                      src={getPaymentProofUrl(selectedPayment.payments[0].id)}
                      originalPath={selectedPayment.payments[0].proofOfPayment}
                      alt="Payment proof"
                      label="Payment Proof Document"
                      imageClassName="w-full max-w-2xl mx-auto rounded-lg border-2 border-[#73e9dd]/30 hover:border-[#73e9dd] transition-all cursor-pointer"
                    />
                    <p className="text-xs text-[#ffdfc0]/60 text-center mt-2">
                      {getFileType(selectedPayment.payments[0].proofOfPayment) === 'pdf' ? 'Click "Open PDF" to view' : 'Click to view full size'}
                    </p>
                  </>
                ) : (
                  <div className="bg-yellow-500/10 border-2 border-yellow-500/30 rounded-lg p-6 sm:p-8 flex flex-col items-center justify-center gap-4">
                    <AlertCircle size={48} className="text-yellow-500" />
                    <p className="text-yellow-300 text-center font-medium text-sm sm:text-base">No payment proof uploaded</p>
                    <p className="text-[#ffdfc0]/60 text-center text-xs sm:text-sm">The user has not provided proof of payment yet</p>
                  </div>
                )}
                <div className="mt-4 pt-4 border-t border-[#73e9dd]/20">
                  <InfoItem 
                    label="Proof Sender Name" 
                    value={selectedPayment.payments?.[0]?.proofSenderName || "No sender name provided"} 
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row flex-wrap gap-2 sm:gap-3 pt-4 border-t border-[#73e9dd]/30">
                {selectedPayment.paymentStatus === 'pending' && (
                  <>
                    <button
                      onClick={() => handleAccept(selectedPayment)}
                      className="w-full sm:flex-1 sm:min-w-[200px] px-4 sm:px-6 py-2 sm:py-3 bg-green-500/20 border border-green-500/50 text-green-300 rounded-lg hover:bg-green-500/30 transition-all font-bold text-sm sm:text-base"
                    >
                      ✓ Accept Payment ({selectedPayment.registrationIds?.length || 1} reg{(selectedPayment.registrationIds?.length || 1) > 1 ? 's' : ''})
                    </button>
                    <button
                      onClick={() => handleDecline(selectedPayment)}
                      className="w-full sm:flex-1 sm:min-w-[200px] px-4 sm:px-6 py-2 sm:py-3 bg-red-500/20 border border-red-500/50 text-red-300 rounded-lg hover:bg-red-500/30 transition-all font-bold text-sm sm:text-base"
                    >
                      ✗ Decline Payment
                    </button>
                  </>
                )}
                {selectedPayment.paymentStatus === 'confirmed' && (
                  <button
                    onClick={() => handleChangeStatus(selectedPayment.registrationId, 'declined')}
                    className="w-full sm:flex-1 sm:min-w-[200px] px-4 sm:px-6 py-2 sm:py-3 bg-red-500/20 border border-red-500/50 text-red-300 rounded-lg hover:bg-red-500/30 transition-all font-bold text-sm sm:text-base"
                  >
                    Change to Declined
                  </button>
                )}
                {selectedPayment.paymentStatus === 'declined' && (
                  <button
                    onClick={() => handleChangeStatus(selectedPayment.registrationId, 'confirmed')}
                    className="w-full sm:flex-1 sm:min-w-[200px] px-4 sm:px-6 py-2 sm:py-3 bg-green-500/20 border border-green-500/50 text-green-300 rounded-lg hover:bg-green-500/30 transition-all font-bold text-sm sm:text-base"
                  >
                    Change to Confirmed
                  </button>
                )}
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="w-full sm:flex-1 sm:min-w-[200px] px-4 sm:px-6 py-2 sm:py-3 bg-[#73e9dd]/20 border border-[#73e9dd]/50 text-[#73e9dd] rounded-lg hover:bg-[#73e9dd]/30 transition-all font-bold text-sm sm:text-base"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Decline Reason Modal */}
      {showDeclineModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="bg-[#232326] rounded-2xl w-full max-w-md p-4 sm:p-6 border-2 border-red-500/30">
            <h3 className="text-lg sm:text-xl font-bold text-red-300 mb-3 sm:mb-4">Decline Payment</h3>
            <p className="text-[#ffdfc0]/60 mb-3 sm:mb-4 text-sm sm:text-base">
              Please provide a reason for declining this payment (optional):
            </p>
            <textarea
              value={declineReason}
              onChange={(e) => setDeclineReason(e.target.value)}
              placeholder="Enter decline reason..."
              className="w-full p-3 bg-[#18181b] border border-red-500/30 text-[#ffdfc0] rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 resize-none h-32 text-sm sm:text-base"
            />
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mt-3 sm:mt-4">
              <button
                onClick={() => {
                  setShowDeclineModal(false);
                  setDeclineReason('');
                }}
                className="flex-1 px-4 py-2 bg-[#73e9dd]/20 border border-[#73e9dd]/50 text-[#73e9dd] rounded-lg hover:bg-[#73e9dd]/30 transition-colors text-sm sm:text-base"
              >
                Cancel
              </button>
              <button
                onClick={confirmDecline}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-red-500/20 border border-red-500/50 text-red-300 rounded-lg hover:bg-red-500/30 transition-colors font-semibold disabled:opacity-50 text-sm sm:text-base"
              >
                {loading ? 'Declining...' : 'Confirm Decline'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}