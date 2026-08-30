import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api';

interface User {
  UserID: number;
  FullName: string;
  Email: string;
  Gender: string;
  AccountStatus: string;
}

const UsersList: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await api.get('/users');
      setUsers(response.data);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  };

  const deleteUser = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await api.delete(`/users/${id}`);
        fetchUsers();
      } catch (error) {
        console.error('Failed to delete user:', error);
      }
    }
  };

  return (
    <div>
      <h2>Manage Users</h2>
      <Link to="/users/create" className="btn btn-success">Add New User</Link>
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Full Name</th>
            <th>Email</th>
            <th>Gender</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map(user => (
            <tr key={user.UserID}>
              <td>{user.UserID}</td>
              <td>{user.FullName}</td>
              <td>{user.Email}</td>
              <td>{user.Gender}</td>
              <td>{user.AccountStatus}</td>
              <td>
                <Link to={`/users/edit/${user.UserID}`} className="btn">Edit</Link>
                <button onClick={() => deleteUser(user.UserID)} className="btn btn-danger" style={{ marginLeft: '10px' }}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default UsersList;
