import { Link } from 'react-router-dom';
import './AboutPage.css';
import { motion } from 'framer-motion';

export default function AboutPage() {
  return (
    <div className="about-page">
      <motion.div 
        className="about-inner"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <Link to="/" className="back-link">
          &larr; Back to Home
        </Link>
        
        <h1 className="about-title">Why the Janus System?</h1>

        <div className="about-content liquid-glass">
          <p>
            Choosing between design iterations is harder than it looks. When you're too close to your own work, every option starts to feel equally valid, and asking for feedback often leads to vague, unhelpful answers.
          </p>
          <p>
            The Janus System solves this by breaking the decision down into simple, one-on-one comparisons. Instead of asking people to rank a list or score options out of ten, it asks one question at a time: <em>which of these two do you prefer?</em> Over many comparisons, a clear winner emerges, not from guesswork, but from genuine collective preference.
          </p>
          <p>
            To get started, upload from 2 upto 50 iterations of your design. You'll get a shareable voting link to send to anyone whose opinion you value such as collaborators, clients, or your audience. As votes come in, a live results dashboard tracks how each iteration is performing in real time using the Elo rating system.
          </p>
          <p>
            No sign-up required. No complicated setup. Just upload your iterations, share the link, and let the results speak for themselves.
          </p>
        </div>

        <div className="about-footer">
          <Link to="/upload" className="about-cta">
            Get Started Now
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
