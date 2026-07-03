import { Link } from 'react-router-dom';
import './LandingPage.css';

export default function LandingPage() {
  return (
    <div className="landing-page">
      <div className="landing-inner">

        <h1 className="landing-title">The 'Janus System'</h1>

        <div className="landing-body">
          <p>
            Choosing between design iterations is harder than it looks. When you're too close to your own work, every option starts to feel equally valid, and asking for feedback often leads to vague, unhelpful answers.
          </p>
          <p>
            The Janus System solves this by breaking the decision down into simple, one-on-one comparisons. Instead of asking people to rank a list or score options out of ten, it asks one question at a time: <em>which of these two do you prefer?</em> Over many comparisons, a clear winner emerges, not from guesswork, but from genuine collective preference.
          </p>
          <p>
            To get started, upload from 2 upto 50 iterations of your design. You'll get a shareable voting link to send to anyone whose opinion you value such as collaborators, clients, or your audience. As votes come in, a live results dashboard tracks how each iteration is performing in real time.
          </p>
          <p>
            No sign-up required. No complicated setup. Just upload your iterations, share the link, and let the results speak for themselves.
          </p>
        </div>

        <Link to="/upload" className="landing-cta">
          Upload Iterations
        </Link>

      </div>
    </div>
  );
}