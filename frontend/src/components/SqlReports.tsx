import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api, { BACKEND_URL } from '../api';

interface QueryCard {
  id: string;
  category: 'queries' | 'views' | 'procedures' | 'triggers';
  title: string;
  description: string;
  badge: string;
  badgeColor: string;
  endpoint: string;
  method?: 'GET' | 'POST';
}

interface ApiResponse {
  success: boolean;
  query?: string;
  object_type?: string;
  object_name?: string;
  status?: string;
  result_status?: string;
  explanation?: string;
  sqlstate_error_captured?: string;
  data?: Record<string, unknown>[];
  parameters?: Record<string, unknown>;
  execution_notes?: string;
}

const QUERY_CARDS: QueryCard[] = [
  // -------------------------------------------------------------
  // 12 CORE ANALYTICAL SQL QUERIES
  // -------------------------------------------------------------
  {
    id: 'q1',
    category: 'queries',
    title: '1. Show all donors with their full name and blood group',
    description: 'INNER JOIN: Joins the donor_profiles table with the users table to retrieve verified donor profiles.',
    badge: 'INNER JOIN',
    badgeColor: '#dc2626',
    endpoint: '/reports/donors/profiles',
  },
  {
    id: 'q2',
    category: 'queries',
    title: '2. How many donations has each donor made? (including zero)',
    description: 'LEFT JOIN + COUNT + GROUP BY: Ensures donors with 0 recorded donations still appear in the output.',
    badge: 'LEFT JOIN + COUNT + GROUP BY',
    badgeColor: '#059669',
    endpoint: '/reports/donors/donation-counts',
  },
  {
    id: 'q3',
    category: 'queries',
    title: '3. What is the average donor radius per blood group?',
    description: 'AVG + GROUP BY: Groups donors by their blood group and computes the average coverage metric.',
    badge: 'AVG + GROUP BY',
    badgeColor: '#7c3aed',
    endpoint: '/reports/donors/average-weight-by-blood-group',
  },
  {
    id: 'q4',
    category: 'queries',
    title: '4. Which donors have completed donations? (Active contributors)',
    description: 'JOIN + COUNT + HAVING: Filters groups after aggregation to highlight active contributors.',
    badge: 'JOIN + COUNT + HAVING',
    badgeColor: '#ea580c',
    endpoint: '/reports/donors/frequent?minimum=1',
  },
  {
    id: 'q5',
    category: 'queries',
    title: '5. What is the total units/volume collected by each hospital/bank?',
    description: 'JOIN + SUM + GROUP BY: Aggregates total units fulfilled per healthcare facility or blood bank.',
    badge: 'JOIN + SUM + GROUP BY',
    badgeColor: '#0891b2',
    endpoint: '/reports/blood-banks/volume-statistics',
  },
  {
    id: 'q6',
    category: 'queries',
    title: '6. Which donors have a coverage radius larger than the global average?',
    description: 'SCALAR SUBQUERY: Compares individual donors against a scalar subquery in the WHERE clause.',
    badge: 'SCALAR SUBQUERY',
    badgeColor: '#b91c1c',
    endpoint: '/reports/donors/above-average-weight',
  },
  {
    id: 'q7',
    category: 'queries',
    title: '7. Which donors have a coverage radius above their OWN blood group average?',
    description: 'CORRELATED SUBQUERY: Evaluates each donor row against an inner subquery correlated on blood_group.',
    badge: 'CORRELATED SUBQUERY',
    badgeColor: '#be185d',
    endpoint: '/reports/donors/above-blood-group-average-weight',
  },
  {
    id: 'q8',
    category: 'queries',
    title: '8. Which donors have completed more donations than the average donor?',
    description: 'HAVING + SUBQUERY: Filters aggregated donation counts using an inner subquery computing average donations.',
    badge: 'HAVING + SUBQUERY',
    badgeColor: '#047857',
    endpoint: '/reports/donors/above-average-donations',
  },
  {
    id: 'q9',
    category: 'queries',
    title: '9. How many total donations has each facility coordinated?',
    description: 'AGGREGATE COUNT: Summarizes transaction volume by medical institution.',
    badge: 'COUNT + GROUP BY',
    badgeColor: '#4338ca',
    endpoint: '/reports/blood-banks/donation-statistics',
  },
  {
    id: 'q10',
    category: 'queries',
    title: '10. Which facilities coordinated more donations than the facility average?',
    description: 'HAVING + SUBQUERY: Identifies hospitals performing above the nationwide average.',
    badge: 'HAVING + SUBQUERY',
    badgeColor: '#d97706',
    endpoint: '/reports/blood-banks/above-average-donations',
  },
  {
    id: 'q11',
    category: 'queries',
    title: '11. How many blood units has each recipient/requester requested in total?',
    description: 'LEFT JOIN + SUM + GROUP BY: Aggregates patient needs by requester identity.',
    badge: 'LEFT JOIN + SUM',
    badgeColor: '#2563eb',
    endpoint: '/reports/recipients/request-statistics',
  },
  {
    id: 'q12',
    category: 'queries',
    title: '12. Which blood requests asked for more units than the average?',
    description: 'SUBQUERY + AVG: Compares individual emergency requests against the dataset mean quantity.',
    badge: 'SUBQUERY + AVG',
    badgeColor: '#4f46e5',
    endpoint: '/reports/requests/above-average-quantity',
  },

  // -------------------------------------------------------------
  // DATABASE VIEWS
  // -------------------------------------------------------------
  {
    id: 'v1',
    category: 'views',
    title: 'View 1: vw_donor_master_summary',
    description: 'CREATE VIEW: Pre-aggregates users, donor profiles, and total units donated into an optimized read view.',
    badge: 'DATABASE VIEW',
    badgeColor: '#0284c7',
    endpoint: '/reports/views/donor-summary',
  },
  {
    id: 'v2',
    category: 'views',
    title: 'View 2: vw_emergency_request_board',
    description: 'CREATE VIEW: Real-time emergency board calculating remaining units required dynamically.',
    badge: 'DATABASE VIEW',
    badgeColor: '#0284c7',
    endpoint: '/reports/views/emergency-board',
  },
  {
    id: 'v3',
    category: 'views',
    title: 'View 3: vw_hospital_donation_stats',
    description: 'CREATE VIEW: Summarizes total collections, first donation, and latest donation dates per healthcare center.',
    badge: 'DATABASE VIEW',
    badgeColor: '#0284c7',
    endpoint: '/reports/views/hospital-stats',
  },

  // -------------------------------------------------------------
  // STORED PROCEDURES & TRANSACTIONS
  // -------------------------------------------------------------
  {
    id: 'sp1',
    category: 'procedures',
    title: 'Stored Procedure: sp_get_eligible_donors_by_group',
    description: "CALL PROCEDURE: Executes MySQL stored procedure with input parameters (IN p_blood_group, IN p_max_radius) enforcing 90-day rest rule.",
    badge: 'STORED PROCEDURE',
    badgeColor: '#9333ea',
    endpoint: '/reports/procedures/eligible-donors?group=O%2B&radius=30',
  },
  {
    id: 'sp2',
    category: 'procedures',
    title: 'Stored Procedure + Transaction: sp_fulfill_blood_request',
    description: 'ACID TRANSACTION: Demonstrates START TRANSACTION, row locking (FOR UPDATE), donation creation, request status transition, and COMMIT.',
    badge: 'TRANSACTION + PROCEDURE',
    badgeColor: '#9333ea',
    endpoint: '/reports/procedures/fulfill-request',
    method: 'POST',
  },

  // -------------------------------------------------------------
  // DATABASE TRIGGERS
  // -------------------------------------------------------------
  {
    id: 'trg1',
    category: 'triggers',
    title: 'Trigger Test: trg_before_donation_prevent_ineligible',
    description: 'BEFORE INSERT TRIGGER: Enforces integrity rule. Rejects inactive donor donation using SIGNAL SQLSTATE 45000.',
    badge: 'TRIGGER (BEFORE INSERT)',
    badgeColor: '#e11d48',
    endpoint: '/reports/triggers/test-prevent-inactive',
    method: 'POST',
  },
  {
    id: 'trg2',
    category: 'triggers',
    title: 'Trigger Audit: trg_audit_request_status_change',
    description: 'AFTER UPDATE TRIGGER: Automatically writes old and new status JSON snapshots into audit_logs whenever a request status changes.',
    badge: 'TRIGGER (AFTER UPDATE)',
    badgeColor: '#e11d48',
    endpoint: '/reports/triggers/audit-logs',
  },
];

const ResultTable: React.FC<{ data: Record<string, unknown>[] }> = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="py-6 text-center text-zinc-500 text-sm">
        No records returned by this query in the current database snapshot.
      </div>
    );
  }

  const columns = Object.keys(data[0]);

  return (
    <div className="overflow-x-auto mt-4 rounded-xl border border-blood-100 bg-white shadow-sm">
      <table className="w-full text-left border-collapse text-sm">
        <thead>
          <tr className="bg-blood-50/60 border-b border-blood-100 text-blood-900 font-bold text-xs uppercase tracking-wider">
            {columns.map((col) => (
              <th key={col} className="py-3 px-4">
                {col.replace(/_/g, ' ')}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">
          {data.map((row, rIdx) => (
            <tr key={rIdx} className="hover:bg-zinc-50 transition-colors">
              {columns.map((col) => (
                <td key={col} className="py-3 px-4 text-zinc-700 font-mono text-xs">
                  {row[col] === null || row[col] === undefined ? (
                    <span className="text-zinc-400 italic">—</span>
                  ) : (
                    String(row[col])
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="px-4 py-2.5 bg-zinc-50 border-t border-zinc-100 text-right text-xs text-zinc-500 font-medium">
        {data.length} row{data.length !== 1 ? 's' : ''} returned
      </div>
    </div>
  );
};

const SqlReports: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'all' | 'queries' | 'views' | 'procedures' | 'triggers'>('all');
  const [activeId, setActiveId] = useState<string | null>(null);
  const [result, setResult] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filteredCards = activeTab === 'all' 
    ? QUERY_CARDS 
    : QUERY_CARDS.filter(c => c.category === activeTab);

  const handleQueryClick = async (card: QueryCard) => {
    if (activeId === card.id) {
      setActiveId(null);
      setResult(null);
      return;
    }

    setActiveId(card.id);
    setResult(null);
    setError(null);
    setLoading(true);

    try {
      const response = card.method === 'POST' 
        ? await api.post<ApiResponse>(card.endpoint)
        : await api.get<ApiResponse>(card.endpoint);
      setResult(response.data);
    } catch (err: any) {
      setError(
        'Could not execute database operation. Verify that MySQL and the Laravel backend are running on http://localhost:8000.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-20 px-5 lg:px-8 max-w-5xl mx-auto">
      {/* Back button & Title Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xs font-bold text-blood-700 hover:text-blood-900 transition-colors mb-3"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            <span>Back to RoktoLinkBD Home</span>
          </Link>
          <h1 className="text-3xl lg:text-4xl font-extrabold text-zinc-900 tracking-tight">
            Database Engine, Views & Procedures
          </h1>
          <p className="text-zinc-500 text-sm mt-1 max-w-2xl">
            Live DBMS demonstration: 12 Raw SQL Queries, Database Views, Stored Procedures with ACID Transactions, and MySQL Triggers.
          </p>
        </div>

        {/* Backend direct status pill */}
        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold shadow-sm">
          <span className="w-2 h-2 rounded-full bg-emerald-500 urgency-dot" />
          <span>Connected to MySQL ({BACKEND_URL}/api)</span>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex flex-wrap gap-2 mb-6 border-b border-blood-100 pb-3">
        {[
          { key: 'all', label: 'All DBMS Features (19)' },
          { key: 'queries', label: '12 Raw SQL Queries' },
          { key: 'views', label: 'Database Views (3)' },
          { key: 'procedures', label: 'Stored Procedures & Transactions (2)' },
          { key: 'triggers', label: 'Database Triggers (2)' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === tab.key
                ? 'bg-blood-700 text-white shadow-md shadow-red-900/20'
                : 'bg-white text-zinc-600 border border-zinc-200 hover:bg-zinc-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Query Cards List */}
      <div className="space-y-4">
        {filteredCards.map((card) => {
          const isActive = activeId === card.id;
          return (
            <div
              key={card.id}
              className={`rounded-2xl border transition-all duration-300 overflow-hidden ${
                isActive
                  ? 'border-red-400 bg-white shadow-xl shadow-red-900/5'
                  : 'border-blood-100 bg-white hover:border-red-200 hover:shadow-md'
              }`}
            >
              {/* Card Header (Clickable) */}
              <div
                onClick={() => handleQueryClick(card)}
                className="p-5 flex items-start gap-4 cursor-pointer select-none"
              >
                <span
                  className="px-2.5 py-1 rounded-md text-[11px] font-extrabold uppercase tracking-wider text-white flex-shrink-0 mt-0.5"
                  style={{ backgroundColor: card.badgeColor }}
                >
                  {card.badge}
                </span>

                <div className="flex-grow min-w-0">
                  <h3 className="text-base font-bold text-zinc-900 leading-snug">
                    {card.title}
                  </h3>
                  <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                    {card.description}
                  </p>
                </div>

                <button
                  type="button"
                  className={`flex-shrink-0 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-blood-700 text-white'
                      : 'bg-blood-50 text-blood-700 border border-blood-200 hover:bg-blood-100'
                  }`}
                >
                  {isActive ? 'Hide Results' : card.method === 'POST' ? 'Execute Live' : 'Run Query'}
                </button>
              </div>

              {/* Collapsible Result Panel */}
              {isActive && (
                <div className="px-5 pb-5 pt-2 border-t border-blood-100/60 bg-gradient-to-b from-blood-50/20 to-white">
                  {loading && (
                    <div className="py-8 flex items-center justify-center gap-3 text-blood-700 font-semibold text-sm">
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                      </svg>
                      <span>Executing query on MySQL database...</span>
                    </div>
                  )}

                  {error && (
                    <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
                      ⚠️ {error}
                    </div>
                  )}

                  {result && (
                    <div>
                      {/* SQL Code Block */}
                      {result.query && (
                        <div className="mb-4">
                          <div className="flex items-center justify-between text-[11px] font-bold text-zinc-400 mb-1 px-1">
                            <span>RAW SQL STATEMENT EXECUTED</span>
                            <span className="font-mono text-blood-700">MySQL 8.0</span>
                          </div>
                          <pre className="p-3.5 rounded-xl bg-zinc-900 text-red-200 text-xs font-mono overflow-x-auto border border-zinc-800 leading-relaxed">
                            {result.query}
                          </pre>
                        </div>
                      )}

                      {/* Trigger / Stored Procedure Explanation Badge */}
                      {result.explanation && (
                        <div className="mb-4 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs leading-relaxed">
                          <div className="font-extrabold text-xs mb-1 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-rose-600 animate-pulse"></span>
                            <span>TRIGGER VERIFICATION SUCCESS</span>
                          </div>
                          <p>{result.explanation}</p>
                          {result.sqlstate_error_captured && (
                            <pre className="mt-2 p-2 bg-rose-100/70 text-rose-950 font-mono text-[11px] rounded-lg">
                              {result.sqlstate_error_captured}
                            </pre>
                          )}
                        </div>
                      )}

                      {/* Transaction & Procedure Note */}
                      {result.execution_notes && (
                        <div className="mb-4 p-4 rounded-xl bg-purple-50 border border-purple-200 text-purple-900 text-xs leading-relaxed">
                          <div className="font-extrabold text-xs mb-1">TRANSACTION CONFIRMATION: {result.result_status}</div>
                          <p>{result.execution_notes}</p>
                        </div>
                      )}

                      {/* Data Table */}
                      {result.data && <ResultTable data={result.data} />}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SqlReports;
