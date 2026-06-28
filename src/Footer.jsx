// src/components/Footer.jsx
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="w-full py-8 mt-auto flex justify-center gap-12 text-xs font-mono tracking-widest text-white/30 uppercase border-t border-white/5">
      <Link to="/privacy" className="hover:text-white/70 transition-colors">Privacy Policy</Link>
      <Link to="/terms" className="hover:text-white/70 transition-colors">Terms of Service</Link>
    </footer>
  );
}