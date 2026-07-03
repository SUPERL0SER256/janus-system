import { useParams, Link } from 'react-router-dom';
import './IntroPage.css';

export default function IntroPage() {
  const { projectId } = useParams();

  return (
    <div className="intro-page">
      <div className="intro-inner">

        <div className="intro-header">
          <span className="intro-label">The 'Janus System'</span>
        </div>

        <div className="intro-hero">
          <h1 className="intro-title">Making choices is hard.<br />We make it simple.</h1>
          <p className="intro-subtitle">
            Someone wants to know which of their designs resonates most — and they've asked for your honest opinion.
          </p>
        </div>

        <div className="intro-steps">
          <div className="intro-step">
            <span className="intro-step-number">1</span>
            <div className="intro-step-text">
              <h3>You'll see two images at a time</h3>
              <p>No long lists, no scores, no noise. Just two options, side by side.</p>
            </div>
          </div>
          <div className="intro-step">
            <span className="intro-step-number">2</span>
            <div className="intro-step-text">
              <h3>Pick the one you prefer</h3>
              <p>Go with your gut. There's no right or wrong answer — your instinct is the point.</p>
            </div>
          </div>
          <div className="intro-step">
            <span className="intro-step-number">3</span>
            <div className="intro-step-text">
              <h3>Your votes shape the ranking</h3>
              <p>Behind the scenes, each choice updates a live score. The strongest design rises to the top.</p>
            </div>
          </div>
        </div>

        <Link to={`/project/${projectId}/vote`} className="intro-cta">
          Start Voting
        </Link>

        <p className="intro-footer-note">Takes about 2 minutes. No sign-up needed.</p>

      </div>
    </div>
  );
}