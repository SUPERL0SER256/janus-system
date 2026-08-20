import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { seoPages } from '../data/seoPages';
import './LandingPage.css';

export default function LandingPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.15 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
  };

  return (
    <div className="landing-page">
      <Helmet>
        <title>Janus System | The Collaborative Design Feedback Tool</title>
      </Helmet>

      {/* Hamburger Menu Button */}
      <button 
        className={`landing-menu-btn ${isMenuOpen ? 'open' : ''}`}
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        aria-label="Toggle menu"
      >
        <span></span>
        <span></span>
        <span></span>
      </button>

      {/* Menu Overlay */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div 
            className="landing-menu-overlay"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            <span className="landing-menu-label">Use Cases</span>
            {seoPages.map((page) => (
              <Link key={page.slug} to={`/${page.slug}`} className="landing-menu-link">
                {page.title.split(' |')[0]}
              </Link>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div 
        className="landing-inner"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={itemVariants} className="hero-block">
          <h1 className="hero-title">The Janus System</h1>
          <p className="hero-subtitle">
            Eliminate choice paralysis. Upload your design iterations, share a link and let collective pairwise voting reveal the best.
          </p>
          
          <div className="hero-actions">
            <Link to="/upload" className="hero-btn hero-btn-light">Upload iterations</Link>
            <Link to="/about" className="hero-btn hero-btn-dark">Learn how it works</Link>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="folder-cards-wrapper">
          <div className="folder-card">
            <div className="folder-card-num">1</div>
            <h3 className="folder-card-title">Upload</h3>
            <p className="folder-card-text">Upload your image iterations and add some context for the voters.</p>
          </div>
          <div className="folder-card">
            <div className="folder-card-num">2</div>
            <h3 className="folder-card-title">Share</h3>
            <p className="folder-card-text">Share the generated link with your community to begin collective pairwise voting.</p>
          </div>
          <div className="folder-card">
            <div className="folder-card-num">3</div>
            <h3 className="folder-card-title">Decide</h3>
            <p className="folder-card-text">Watch the live dashboard as pairwise comparisons generate reliable Elo ratings.</p>
          </div>
        </motion.div>

      </motion.div>
      <div className="landing-credit">Design © Sumer Vaidya 2026</div>
    </div>
  );
}