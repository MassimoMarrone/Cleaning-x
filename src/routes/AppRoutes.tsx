import { Routes, Route, Navigate } from 'react-router-dom';
import Home from '../pages/Home';
import Services from '../pages/Services';
import About from '../pages/About';
import Contact from '../pages/Contact';
import Dashboard from '../pages/Dashboard';
import ProviderDashboard from '../pages/ProviderDashboard';
import ClientDashboard from '../pages/ClientDashboard';
import PublishService from '../pages/PublishService';
import WriteReview from '../pages/WriteReview';
import Reviews from '../pages/Reviews';
import Profile from '../pages/Profile';

interface AppRoutesProps {
  isLoggedIn: boolean;
}

export default function AppRoutes({ isLoggedIn }: AppRoutesProps) {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/services" element={<Services />} />
      <Route path="/about" element={<About />} />
      <Route path="/contact" element={<Contact />} />
      
      {/* Pagine private, accessibili solo se loggato */}
      <Route path="/dashboard" element={isLoggedIn ? <Dashboard /> : <Navigate to="/" />} />
      <Route path="/provider-dashboard" element={isLoggedIn ? <ProviderDashboard /> : <Navigate to="/" />} />
      <Route path="/client-dashboard" element={isLoggedIn ? <ClientDashboard /> : <Navigate to="/" />} />
      <Route path="/publish-service" element={isLoggedIn ? <PublishService /> : <Navigate to="/" />} />
      <Route path="/write-review/:bookingId" element={isLoggedIn ? <WriteReview /> : <Navigate to="/" />} />
      <Route path="/reviews/:providerId" element={<Reviews />} />
      <Route path="/profile" element={isLoggedIn ? <Profile /> : <Navigate to="/" />} />
      
      <Route path="/settings" element={isLoggedIn ? (
        <div>
          <h2>Impostazioni</h2>
          <p>Gestisci le impostazioni del tuo account e le preferenze di notifica.</p>
          <ul>
            <li>Notifiche email: <input type="checkbox" defaultChecked /></li>
            <li>Lingua: <select><option>Italiano</option><option>English</option></select></li>
          </ul>
        </div>
      ) : <Navigate to="/" />} />
      
      <Route path="/bookings" element={isLoggedIn ? <ClientDashboard /> : <Navigate to="/" />} />
      
      <Route path="/favorites" element={isLoggedIn ? (
        <div>
          <h2>Servizi preferiti</h2>
          <p>Qui troverai i servizi che hai aggiunto ai preferiti.</p>
          <ul>
            <li>Nessun servizio preferito.</li>
          </ul>
        </div>
      ) : <Navigate to="/" />} />
      
      <Route path="/support" element={isLoggedIn ? (
        <div>
          <h2>Supporto</h2>
          <p>Hai bisogno di aiuto? Inviaci una richiesta!</p>
          <form className="support-form">
            <textarea placeholder="Scrivi qui la tua richiesta..." rows={4} style={{width: '100%', borderRadius: '8px', border: '1px solid #2d72d9', padding: '10px'}} />
            <button type="submit" className="submit-btn" style={{marginTop: '10px'}}>Invia richiesta</button>
          </form>
        </div>
      ) : <Navigate to="/" />} />
    </Routes>
  );
}
