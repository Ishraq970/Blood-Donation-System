import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api';

interface Donor {
  DonorID: number;
  BloodGroup: string;
  City: string;
  LastDonationDate: string;
  IsEligible: boolean;
  user?: { FullName: string };
}

const DonorsList: React.FC = () => {
  const [donors, setDonors] = useState<Donor[]>([]);

  useEffect(() => {
    fetchDonors();
  }, []);

  const fetchDonors = async () => {
    try {
      const response = await api.get('/donors');
      setDonors(response.data);
    } catch (error) {
      console.error('Failed to fetch donors:', error);
    }
  };

  const deleteDonor = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this donor?')) {
      try {
        await api.delete(`/donors/${id}`);
        fetchDonors();
      } catch (error) {
        console.error('Failed to delete donor:', error);
      }
    }
  };

  return (
    <div>
      <h2>Manage Donors</h2>
      <Link to="/donors/create" className="btn btn-success">Add New Donor</Link>
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>User</th>
            <th>Blood Group</th>
            <th>City</th>
            <th>Last Donation</th>
            <th>Eligible?</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {donors.map(donor => (
            <tr key={donor.DonorID}>
              <td>{donor.DonorID}</td>
              <td>{donor.user?.FullName || 'Unknown'}</td>
              <td>{donor.BloodGroup}</td>
              <td>{donor.City}</td>
              <td>{donor.LastDonationDate}</td>
              <td>{donor.IsEligible ? 'Yes' : 'No'}</td>
              <td>
                <Link to={`/donors/edit/${donor.DonorID}`} className="btn">Edit</Link>
                <button onClick={() => deleteDonor(donor.DonorID)} className="btn btn-danger" style={{ marginLeft: '10px' }}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DonorsList;
