import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import api from '../../api';

const UserForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    FullName: '',
    Email: '',
    PasswordHash: '',
    Phone: '',
    Address: '',
    Gender: '',
    AccountStatus: 'Active'
  });

  useEffect(() => {
    if (id) {
      api.get(`/users/${id}`).then(response => {
        setFormData({ ...response.data, PasswordHash: '' });
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
        await api.put(`/users/${id}`, formData);
      } else {
        await api.post('/users', formData);
      }
      navigate('/users');
    } catch (error: any) {
      console.error('Failed to save user:', error);
      if (error.response && error.response.data && error.response.data.message) {
        alert('Validation Error: ' + error.response.data.message);
      } else {
        alert('Error saving user. Check console.');
      }
    }
  };

  return (
    <div>
      <h2>{id ? 'Edit User' : 'Add New User'}</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Full Name:</label>
          <input type="text" name="FullName" value={formData.FullName} onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label>Email:</label>
          <input type="email" name="Email" value={formData.Email} onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label>Password {id ? '(leave blank to keep current)' : ''}:</label>
          <input type="password" name="PasswordHash" value={formData.PasswordHash} onChange={handleChange} required={!id} />
        </div>
        <div className="form-group">
          <label>Phone:</label>
          <input type="text" name="Phone" value={formData.Phone || ''} onChange={handleChange} />
        </div>
        <div className="form-group">
          <label>Address:</label>
          <input type="text" name="Address" value={formData.Address || ''} onChange={handleChange} />
        </div>
        <div className="form-group">
          <label>Gender:</label>
          <select name="Gender" value={formData.Gender || ''} onChange={handleChange}>
            <option value="">Select...</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </select>
        </div>
        {id && (
          <div className="form-group">
            <label>Status:</label>
            <select name="AccountStatus" value={formData.AccountStatus} onChange={handleChange}>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        )}
        <button type="submit" className="btn btn-success">Save User</button>
        <Link to="/users" className="btn btn-secondary">Cancel</Link>
      </form>
    </div>
  );
};

export default UserForm;
