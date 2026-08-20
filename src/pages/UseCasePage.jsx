import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { seoPages } from '../data/seoPages';
import './UseCasePage.css';

export default function UseCasePage() {
  const { slug } = useParams();
  
  const pageData = seoPages.find(page => page.slug === slug);

  if (!pageData) {
    return (
      <div className="usecase-page">
        <div className="usecase-inner liquid-glass">
          <h1>Page Not Found</h1>
          <Link to="/" className="back-link">Return Home</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="usecase-page">
      <Helmet>
        <title>{pageData.title}</title>
        <meta name="description" content={pageData.description} />
        <meta property="og:title" content={pageData.title} />
        <meta property="og:description" content={pageData.description} />
        <meta name="twitter:title" content={pageData.title} />
        <meta name="twitter:description" content={pageData.description} />
      </Helmet>

      <motion.div 
        className="usecase-inner"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <header className="usecase-header">
          <Link to="/" className="usecase-logo">The Janus System</Link>
        </header>

        <div className="usecase-content liquid-glass">
          <h1 className="usecase-title">{pageData.h1}</h1>
          <p className="usecase-hero-text">{pageData.heroText}</p>
          
          <div className="usecase-cta-wrap">
            <Link to="/upload" className="usecase-cta">
              {pageData.ctaText}
            </Link>
          </div>
        </div>

      </motion.div>
    </div>
  );
}
