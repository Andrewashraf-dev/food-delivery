import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import NotFound from './components/NotFound';
import Home from './pages/Home';
import Menu from './pages/Menu';
import Order from './pages/Order';
import About from './pages/About';
import Contact from './pages/Contact';
import Login from './pages/Login';
import Admin from './pages/Admin';
import TrackOrder from './pages/TrackOrder';

function AppShell() {
  const { i18n } = useTranslation();
  const toasterPosition = i18n.dir() === 'rtl' ? 'top-left' : 'top-right';

  return (
    <div className="min-h-screen bg-brand-dark text-brand-cream">
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/menu" element={<Menu />} />
          <Route path="/order" element={<Order />} />
          <Route path="/checkout" element={<Order />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/login" element={<Login />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/track-order" element={<TrackOrder />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
      <Toaster
        position={toasterPosition}
        toastOptions={{
          style: { background: '#1A0A00', color: '#FFF8F0', border: '1px solid rgba(245,166,35,0.3)' },
          success: { iconTheme: { primary: '#F5A623', secondary: '#1A0A00' } },
          error: { iconTheme: { primary: '#D4150C', secondary: '#FFF8F0' } },
        }}
      />
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AppShell />
    </Router>
  );
}
