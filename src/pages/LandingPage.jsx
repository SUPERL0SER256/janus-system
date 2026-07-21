import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import './LandingPage.css';

export default function LandingPage() {
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
      <motion.div 
        className="landing-inner"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={itemVariants} className="hero-section">
          <h1 className="landing-title">The 'Janus System'</h1>
          <p className="hero-subtitle">
            Eliminate choice paralysis. Upload your design iterations, share a link, and let collective pairwise voting reveal the strongest design.
          </p>
          <div className="hero-actions">
            <Link to="/upload" className="landing-cta primary">
              Upload Iterations
            </Link>
            <Link to="/about" className="landing-cta secondary">
              Learn How It Works
            </Link>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="features-section">
          <div className="feature-card">
            <div className="feature-icon">1</div>
            <h3>Upload</h3>
            <p>Upload between 2 and 50 design iterations you want to compare.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">2</div>
            <h3>Share</h3>
            <p>Send your unique voting link to clients, collaborators, or your audience.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">3</div>
            <h3>Decide</h3>
            <p>Watch the live dashboard as pairwise comparisons generate reliable Elo ratings.</p>
          </div>
        </motion.div>

      </motion.div>
      <div className="landing-credit">
        Design © Sumer Vaidya 2026
      </div>
    </div>
  );
}