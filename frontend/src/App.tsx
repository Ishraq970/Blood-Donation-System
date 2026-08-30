import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import UsersList from './components/users/UsersList';
import UserForm from './components/users/UserForm';
import DonorsList from './components/donors/DonorsList';
import DonorForm from './components/donors/DonorForm';
import Home from './components/Home';

// Navigation Bar Component
const Navigation = () => {
  const location = useLocation();
  return (
    <nav>
      <Link to="/" className={location.pathname === '/' ? 'active' : ''}>Home</Link>
      <Link to="/users" className={location.pathname.startsWith('/users') ? 'active' : ''}>Manage Users</Link>
      <Link to="/donors" className={location.pathname.startsWith('/donors') ? 'active' : ''}>Manage Donors</Link>
    </nav>
  );
};

// Main App Component
const App: React.FC = () => {
  return (
    <Router>
      <Navigation />
      <div className="container">
        <Routes>
          {/* Home Route */}
          <Route path="/" element={<Home />} />
          
          {/* Users Routes */}
          <Route path="/users" element={<UsersList />} />
          <Route path="/users/create" element={<UserForm />} />
          <Route path="/users/edit/:id" element={<UserForm />} />
          
          {/* Donors Routes */}
          <Route path="/donors" element={<DonorsList />} />
          <Route path="/donors/create" element={<DonorForm />} />
          <Route path="/donors/edit/:id" element={<DonorForm />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;
