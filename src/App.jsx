import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import BookingForm from './pages/BookingForm';
import SecretaryPanel from './pages/SecretaryPanel';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen flex flex-col">
          <Navbar />
          <main className="flex-1 pb-12">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/booking" element={<BookingForm />} />
              <Route path="/secretary" element={<SecretaryPanel />} />
            </Routes>
          </main>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
