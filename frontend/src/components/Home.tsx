import React from 'react';
import { Link } from 'react-router-dom';

const Home: React.FC = () => {
  return (
    <div style={{ textAlign: 'center', marginTop: '50px' }}>
      <h1>Welcome to the Blood Donation System</h1>
      <br />
      <Link to="/users" className="btn btn-success" style={{ padding: '10px 20px', fontSize: '18px' }}>Manage Users</Link>
      <Link to="/donors" className="btn btn-success" style={{ padding: '10px 20px', fontSize: '18px', marginLeft: '10px' }}>Manage Donors</Link>
    </div>
  );
};

export default Home;
