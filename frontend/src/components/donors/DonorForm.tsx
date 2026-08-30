import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import api from '../../api';

interface User {
  UserID: number;
  FullName: string;
}

const DonorForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [formData, setFormData] = useState({
    UserID: '',
    BloodGroup: '',
    Genotype: '',
    DateOfBirth: '',
    WeightKg: '',
    City: '',
    LastDonationDate: '',
    IsEligible: '1'
  });

  useEffect(() => {
    // Fetch users for the dropdown
    api.get('/users').then(res => setUsers(res.data));

    if (id) {
      api.get(`/donors/${id}`).then(response => {
        setFormData({
          ...response.data,
          IsEligible: response.data.IsEligible ? '1' : '0'
        });
      });
    }
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (id) {
        await api.put(`/donors/${id}`, formData);
      } else {
        await api.post('/donors', formData);
      }
      navigate('/donors');
    } catch (error: any) {
      console.error('Failed to save donor:', error);
      if (error.response && error.response.data && error.response.data.message) {
        alert('Validation Error: ' + error.response.data.message);
      } else {
        alert('Error saving donor. Check console.');
      }
    }
  };

  return (
    <div>
      <h2>{id ? 'Edit Donor' : 'Add New Donor'}</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Select User:</label>
          <select name="UserID" value={formData.UserID} onChange={handleChange} required>
            <option value="">Select...</option>
            {users.map(u => (
              <option key={u.UserID} value={u.UserID}>{u.FullName}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label>Blood Group:</label>
          <input type="text" name="BloodGroup" value={formData.BloodGroup} onChange={handleChange} required maxLength={5} />
        </div>
        <div className="form-group">
          <label>Genotype:</label>
          <input type="text" name="Genotype" value={formData.Genotype || ''} onChange={handleChange} maxLength={10} />
        </div>
        <div className="form-group">
          <label>Date of Birth:</label>
          <input type="date" name="DateOfBirth" value={formData.DateOfBirth || ''} onChange={handleChange} />
        </div>
        <div className="form-group">
          <label>Weight (Kg):</label>
          <input type="number" step="0.01" name="WeightKg" value={formData.WeightKg || ''} onChange={handleChange} />
        </div>
        <div className="form-group">
          <label>City:</label>
          <input type="text" name="City" value={formData.City || ''} onChange={handleChange} />
        </div>
        <div className="form-group">
          <label>Last Donation Date:</label>
          <input type="date" name="LastDonationDate" value={formData.LastDonationDate || ''} onChange={handleChange} />
        </div>
        <div className="form-group">
          <label>Is Eligible:</label>
          <select name="IsEligible" value={formData.IsEligible} onChange={handleChange}>
            <option value="1">Yes</option>
            <option value="0">No</option>
          </select>
        </div>
        <button type="submit" className="btn btn-success">Save Donor</button>
        <Link to="/donors" className="btn btn-secondary">Cancel</Link>
      </form>
    </div>
  );
};

export default DonorForm;
