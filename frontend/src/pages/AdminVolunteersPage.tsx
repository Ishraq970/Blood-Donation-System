import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  fetchAdminVolunteersApi,
  approveVolunteerApi,
  rejectVolunteerApi,
  revokeVolunteerApi,
  type AdminVolunteerItem,
} from '../api';

interface AdminVolunteersPageProps {
  isBn: boolean;
  onToast: (msg: string) => void;
}

const AdminVolunteersPage: React.FC<AdminVolunteersPageProps> = ({ isBn, onToast }) => {
  const { user } = useAuth();
  const [volunteers, setVolunteers] = useState<AdminVolunteerItem[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('PENDING');
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<number | null>(null);

  const loadData = async (status: string) => {
    setLoading(true);
    try {
      const data = await fetchAdminVolunteersApi(status);
      setVolunteers(data);
    } catch {
      onToast(isBn ? 'স্বেচ্ছাসেবক তালিকা লোড করতে ব্যর্থ হয়েছে।' : 'Failed to load volunteer applications.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(statusFilter);
  }, [statusFilter]);

  const handleApprove = async (id: number) => {
    setActionId(id);
    try {
      await approveVolunteerApi(id);
      onToast(isBn ? 'স্বেচ্ছাসেবক সফলভাবে অনুমোদিত হয়েছে!' : 'Volunteer approved successfully!');
      await loadData(statusFilter);
    } catch {
      onToast(isBn ? 'অনুমোদন ব্যর্থ হয়েছে।' : 'Approval failed.');
    } finally {
      setActionId(null);
    }
  };

  const handleReject = async (id: number) => {
    const reason = window.prompt(
      isBn ? 'প্রত্যাখ্যানের কারণ লিখুন:' : 'Enter reason for rejection:',
      'NID/credentials could not be verified'
    );
    if (!reason) return;

    setActionId(id);
    try {
      await rejectVolunteerApi(id, reason);
      onToast(isBn ? 'আবেদন প্রত্যাখ্যান করা হয়েছে।' : 'Application rejected.');
      await loadData(statusFilter);
    } catch {
      onToast(isBn ? 'প্রত্যাখ্যান ব্যর্থ হয়েছে।' : 'Rejection failed.');
    } finally {
      setActionId(null);
    }
  };

  const handleRevoke = async (id: number) => {
    const confirm = window.confirm(
      isBn
        ? 'আপনি কি নিশ্চিত যে এই স্বেচ্ছাসেবকের সুযোগ স্থগিত করতে চান? (ইতিহাস সংরক্ষিত থাকবে)'
        : 'Are you sure you want to revoke volunteer access? (Case history will be preserved)'
    );
    if (!confirm) return;

    setActionId(id);
    try {
      await revokeVolunteerApi(id, 'Admin revoked access');
      onToast(isBn ? 'স্বেচ্ছাসেবক সুযোগ স্থগিত করা হয়েছে।' : 'Volunteer privileges revoked.');
      await loadData(statusFilter);
    } catch {
      onToast(isBn ? 'স্থগিতকরণ ব্যর্থ হয়েছে।' : 'Revocation failed.');
    } finally {
      setActionId(null);
    }
  };

  if (!user?.is_admin) {
    return (
      <div className="min-h-screen pt-36 pb-20 px-5 text-center max-w-md mx-auto">
        <div className="p-8 rounded-3xl bg-white border border-red-100 shadow-xl space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto text-3xl">
            🔒
          </div>
          <h2 className="text-xl font-black text-zinc-900">
            {isBn ? 'অ্যাডমিন অনুমতি প্রয়োজন' : 'Admin Privileges Required'}
          </h2>
          <p className="text-xs text-zinc-500">
            {isBn
              ? 'শুধুমাত্র অনুমোদিত অ্যাডমিন স্বেচ্ছাসেবক আবেদন পর্যালোচনা করতে পারেন।'
              : 'Only authenticated administrators can review and approve volunteer credentials.'}
          </p>
          <Link to="/" className="btn-primary px-6 py-2.5 rounded-xl font-bold text-xs inline-block">
            {isBn ? 'হোমপেজে ফিরুন' : 'Back to Home'}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-28 pb-20 px-5 max-w-6xl mx-auto space-y-8">
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-xs font-extrabold tracking-[0.25em] uppercase text-red-600">
            {isBn ? 'অ্যাডমিন নিয়ন্ত্রণ প্যানেল' : 'Administrative Governance'}
          </span>
          <h1 className="text-3xl font-black text-zinc-900 tracking-tight mt-1">
            {isBn ? 'স্বেচ্ছাসেবক যাচাই ও পরিচালনা' : 'Volunteer Verification & Management'}
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            {isBn
              ? 'জাতীয় পরিচয়পত্র ও আবেদন পর্যালোচনা করে সমন্বয়কারী হিসেবে অনুমোদন বা স্থগিত করুন'
              : 'Review credentials, NID documents, and authorize verified emergency coordinators'}
          </p>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex bg-white rounded-2xl border border-zinc-200 p-1.5 shadow-xs">
          {[
            { key: 'PENDING', labelEn: 'Pending Review', labelBn: 'অপেক্ষমাণ' },
            { key: 'APPROVED', labelEn: 'Approved', labelBn: 'অনুমোদিত' },
            { key: 'REJECTED', labelEn: 'Rejected', labelBn: 'প্রত্যাখ্যাত' },
            { key: 'ALL', labelEn: 'All Applications', labelBn: 'সকল আবেদন' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key)}
              className={`py-2 px-3.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                statusFilter === tab.key
                  ? 'bg-red-600 text-white shadow-xs'
                  : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50'
              }`}
            >
              {isBn ? tab.labelBn : tab.labelEn}
            </button>
          ))}
        </div>
      </div>

      {/* Main Table Card */}
      <div className="rounded-3xl bg-white border border-red-100 shadow-xl overflow-hidden">
        {loading ? (
          <div className="py-20 flex justify-center">
            <div className="w-10 h-10 rounded-full border-3 border-red-600 border-t-transparent animate-spin" />
          </div>
        ) : volunteers.length === 0 ? (
          <div className="py-20 text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-zinc-100 text-zinc-400 flex items-center justify-center mx-auto text-2xl">
              📋
            </div>
            <h3 className="text-base font-bold text-zinc-700">
              {isBn ? 'কোনো আবেদন পাওয়া যায়নি' : 'No volunteer applications in this view'}
            </h3>
            <p className="text-xs text-zinc-400 max-w-sm mx-auto">
              {isBn ? 'নির্বাচিত ফিল্টারে কোনো রেকর্ড নেই।' : 'No records matching the selected status filter.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-100 bg-zinc-50/70 text-[11px] font-extrabold uppercase tracking-wider text-zinc-500">
                  <th className="py-4 px-6">Code / Applicant</th>
                  <th className="py-4 px-6">Contact Phone</th>
                  <th className="py-4 px-6">Organization</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6">Applied Date</th>
                  <th className="py-4 px-6 text-right">Admin Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 text-xs">
                {volunteers.map((vol) => (
                  <tr key={vol.id} className="hover:bg-zinc-50/60 transition-colors">
                    <td className="py-4 px-6">
                      <span className="font-mono font-bold text-red-600 text-[11px] block">{vol.volunteer_code}</span>
                      <span className="font-bold text-zinc-900 text-sm block">{vol.user?.name || 'Applicant'}</span>
                      <span className="text-[11px] text-zinc-400 font-mono">{vol.user?.email}</span>
                    </td>
                    <td className="py-4 px-6 font-mono font-semibold text-zinc-700">
                      {vol.emergency_contact_phone}
                    </td>
                    <td className="py-4 px-6 text-zinc-600">
                      {vol.organization_affiliation || 'Independent Volunteer'}
                    </td>
                    <td className="py-4 px-6">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          vol.verification_status === 'APPROVED'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : vol.verification_status === 'PENDING'
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : 'bg-rose-100 text-rose-800 border border-rose-200'
                        }`}
                      >
                        {vol.verification_status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-zinc-500 text-[11px]">
                      {new Date(vol.created_at).toLocaleDateString('en-BD', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {vol.verification_status === 'PENDING' && (
                          <>
                            <button
                              onClick={() => handleApprove(vol.id)}
                              disabled={actionId === vol.id}
                              className="py-1.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors cursor-pointer shadow-xs disabled:opacity-50"
                            >
                              ✓ {isBn ? 'অনুমোদন' : 'Approve'}
                            </button>
                            <button
                              onClick={() => handleReject(vol.id)}
                              disabled={actionId === vol.id}
                              className="py-1.5 px-3 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs transition-colors cursor-pointer disabled:opacity-50"
                            >
                              ✕ {isBn ? 'প্রত্যাখ্যান' : 'Reject'}
                            </button>
                          </>
                        )}

                        {vol.verification_status === 'APPROVED' && (
                          <button
                            onClick={() => handleRevoke(vol.id)}
                            disabled={actionId === vol.id}
                            className="py-1.5 px-3 rounded-xl border border-zinc-200 hover:bg-zinc-100 text-zinc-600 font-bold text-xs transition-colors cursor-pointer disabled:opacity-50"
                          >
                            🚫 {isBn ? 'সুযোগ স্থগিত' : 'Revoke'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminVolunteersPage;
