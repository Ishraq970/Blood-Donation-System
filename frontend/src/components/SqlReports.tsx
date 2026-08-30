import React, { useState } from 'react';
import api from '../api';

// -----------------------------------------------------------------------
// Type Definitions
// -----------------------------------------------------------------------

// Each "query card" shown on screen has a title, description, SQL concept
// badge, and an API endpoint to call when clicked.
interface QueryCard {
  id: string;
  title: string;
  description: string;
  badge: string;       // e.g. "INNER JOIN", "LEFT JOIN + COUNT"
  badgeColor: string;  // CSS color for the badge
  endpoint: string;    // the /api/reports/... URL to fetch
}

// The API always returns { success: true, query: "...", data: [...] }
interface ApiResponse {
  success: boolean;
  query: string;
  data: Record<string, unknown>[];
}

// -----------------------------------------------------------------------
// Query Card Definitions
// All 12 questions that the user can click on
// -----------------------------------------------------------------------
const QUERY_CARDS: QueryCard[] = [
  {
    id: 'q1',
    title: 'Show all donors with their full name and blood group',
    description: 'Joins the Donors table with the Users table to get the personal details of every donor.',
    badge: 'INNER JOIN',
    badgeColor: '#3182ce',
    endpoint: '/reports/donors/profiles',
  },
  {
    id: 'q2',
    title: 'How many donations has each donor made? (including zero)',
    description: 'Uses LEFT JOIN so donors who have NEVER donated still appear in the result with a count of 0.',
    badge: 'LEFT JOIN + COUNT + GROUP BY',
    badgeColor: '#2f855a',
    endpoint: '/reports/donors/donation-counts',
  },
  {
    id: 'q3',
    title: 'What is the average donor weight per blood group?',
    description: 'Groups all donors by their blood group and calculates the average weight for each group.',
    badge: 'AVG + GROUP BY',
    badgeColor: '#6b46c1',
    endpoint: '/reports/donors/average-weight-by-blood-group',
  },
  {
    id: 'q4',
    title: 'Which donors have donated at least 3 times?',
    description: 'HAVING filters the groups after counting — keeping only donors who reached the minimum threshold.',
    badge: 'JOIN + COUNT + HAVING',
    badgeColor: '#c05621',
    endpoint: '/reports/donors/frequent?minimum=3',
  },
  {
    id: 'q5',
    title: 'What is the total blood volume collected by each blood bank?',
    description: 'SUM adds up all donation volumes (in mL) grouped per blood bank.',
    badge: 'JOIN + SUM + GROUP BY',
    badgeColor: '#285e61',
    endpoint: '/reports/blood-banks/volume-statistics',
  },
  {
    id: 'q6',
    title: 'Which donors weigh more than the global average weight?',
    description: 'A subquery first calculates the average weight, then the main query compares each donor against it.',
    badge: 'SUBQUERY + AVG',
    badgeColor: '#702459',
    endpoint: '/reports/donors/above-average-weight',
  },
  {
    id: 'q8',
    title: 'Which donors have donated more than the average number of donations?',
    description: 'The most advanced query — combines JOIN, COUNT, GROUP BY, HAVING, and a subquery all in one.',
    badge: 'JOIN + COUNT + HAVING + SUBQUERY',
    badgeColor: '#e53e3e',
    endpoint: '/reports/donors/above-average-donations',
  },
  {
    id: 'q9',
    title: 'How many donations has each blood bank received?',
    description: 'Groups donations by blood bank and counts how many were received at each one.',
    badge: 'LEFT JOIN + COUNT + GROUP BY',
    badgeColor: '#2f855a',
    endpoint: '/reports/blood-banks/donation-statistics',
  },
  {
    id: 'q10',
    title: 'Which blood banks received more donations than the average?',
    description: 'A subquery calculates the average donations per bank, then HAVING filters banks above that threshold.',
    badge: 'JOIN + HAVING + SUBQUERY',
    badgeColor: '#744210',
    endpoint: '/reports/blood-banks/above-average-donations',
  },
  {
    id: 'q11',
    title: 'How many blood units has each recipient requested in total?',
    description: 'LEFT JOIN ensures recipients with zero requests still appear. SUM totals their requested units.',
    badge: 'LEFT JOIN + SUM + GROUP BY',
    badgeColor: '#285e61',
    endpoint: '/reports/recipients/request-statistics',
  },
  {
    id: 'q12',
    title: 'Which blood requests asked for more units than the average?',
    description: 'A subquery calculates the average quantity, then the outer query returns only requests above that.',
    badge: 'SUBQUERY + AVG',
    badgeColor: '#702459',
    endpoint: '/reports/requests/above-average-quantity',
  },
  {
    id: 'q13',
    title: 'What is the minimum and maximum donor weight per blood group?',
    description: 'Uses MIN() and MAX() aggregate functions grouped by blood group.',
    badge: 'MIN + MAX + GROUP BY',
    badgeColor: '#2c5282',
    endpoint: '/reports/donors/weight-range-by-blood-group',
  },
];

// -----------------------------------------------------------------------
// ResultTable Component
// Dynamically renders a table from any array of objects.
// The column headers are taken from the object keys automatically.
// -----------------------------------------------------------------------
const ResultTable: React.FC<{ data: Record<string, unknown>[] }> = ({ data }) => {
  if (!data || data.length === 0) {
    return <p style={{ color: '#718096', marginTop: '15px' }}>No results found.</p>;
  }

  // Get column names from the first row's keys
  const columns = Object.keys(data[0]);

  return (
    <div style={{ overflowX: 'auto', marginTop: '20px' }}>
      <table>
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col}>{col.replace(/_/g, ' ')}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {columns.map((col) => (
                <td key={col}>
                  {row[col] === null || row[col] === undefined
                    ? <span style={{ color: '#a0aec0', fontStyle: 'italic' }}>—</span>
                    : String(row[col])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <p style={{ color: '#718096', fontSize: '0.85rem', marginTop: '10px' }}>
        {data.length} row{data.length !== 1 ? 's' : ''} returned
      </p>
    </div>
  );
};

// -----------------------------------------------------------------------
// Main SqlReports Component
// -----------------------------------------------------------------------
const SqlReports: React.FC = () => {
  // Which query card is currently selected (by its id)
  const [activeId, setActiveId] = useState<string | null>(null);
  // The result data from the API
  const [result, setResult] = useState<ApiResponse | null>(null);
  // Loading state while the API call is in progress
  const [loading, setLoading] = useState(false);
  // Error message if the API call fails
  const [error, setError] = useState<string | null>(null);

  // Called when the user clicks a query card
  const handleQueryClick = async (card: QueryCard) => {
    // If same card is clicked again, collapse it
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
      const response = await api.get<ApiResponse>(card.endpoint);
      setResult(response.data);
    } catch (err) {
      setError('Could not connect to the backend. Make sure php artisan serve is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Page Header */}
      <h1 style={{ marginBottom: '5px' }}>SQL Reports</h1>
      <p style={{ color: '#718096', marginTop: 0, marginBottom: '30px' }}>
        Click any question below to run the SQL query and see the result table.
        Each query demonstrates a specific database concept.
      </p>

      {/* Query Cards Grid */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {QUERY_CARDS.map((card) => {
          const isActive = activeId === card.id;
          return (
            <div key={card.id}>
              {/* Clickable Question Card */}
              <div
                onClick={() => handleQueryClick(card)}
                style={{
                  border: `2px solid ${isActive ? card.badgeColor : '#e2e8f0'}`,
                  borderRadius: '10px',
                  padding: '16px 20px',
                  cursor: 'pointer',
                  backgroundColor: isActive ? '#fff5f5' : '#ffffff',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '14px',
                }}
              >
                {/* Expand / Collapse Arrow */}
                <span style={{
                  fontSize: '1.2rem',
                  color: card.badgeColor,
                  marginTop: '2px',
                  transition: 'transform 0.2s',
                  transform: isActive ? 'rotate(90deg)' : 'rotate(0deg)',
                  display: 'inline-block',
                }}>
                  ▶
                </span>

                <div style={{ flex: 1 }}>
                  {/* SQL Concept Badge */}
                  <span style={{
                    display: 'inline-block',
                    backgroundColor: card.badgeColor,
                    color: 'white',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '20px',
                    marginBottom: '6px',
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                  }}>
                    {card.badge}
                  </span>

                  {/* Question Title */}
                  <p style={{
                    margin: '0 0 4px 0',
                    fontWeight: 600,
                    fontSize: '1rem',
                    color: '#2d3748',
                  }}>
                    {card.title}
                  </p>

                  {/* Description */}
                  <p style={{ margin: 0, fontSize: '0.85rem', color: '#718096' }}>
                    {card.description}
                  </p>
                </div>
              </div>

              {/* Result Area — shown below the active card */}
              {isActive && (
                <div style={{
                  border: `2px solid ${card.badgeColor}`,
                  borderTop: 'none',
                  borderRadius: '0 0 10px 10px',
                  padding: '20px',
                  backgroundColor: '#fafafa',
                }}>
                  {/* Error Message */}
                  {error && (
                    <p style={{ color: '#e53e3e', fontWeight: 600 }}>⚠️ {error}</p>
                  )}

                  {/* Results */}
                  {result && !loading && (
                    <>
                      {/* SQL Concept Description */}
                      <div style={{
                        backgroundColor: '#ebf8ff',
                        border: '1px solid #bee3f8',
                        borderRadius: '8px',
                        padding: '10px 15px',
                        marginBottom: '5px',
                      }}>
                        <strong style={{ color: '#2b6cb0', fontSize: '0.85rem' }}>
                          SQL Concept Used:
                        </strong>
                        <span style={{ color: '#2c5282', fontSize: '0.85rem', marginLeft: '6px' }}>
                          {result.query}
                        </span>
                      </div>

                      {/* Data Table */}
                      <ResultTable data={result.data} />
                    </>
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
