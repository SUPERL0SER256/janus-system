import { Link } from 'react-router-dom';
import './legal.css';

export default function Privacy() {
  return (
    <div className="legal-page">
      <div className="legal-inner">
        <Link to="/" className="legal-back">← Back</Link>
        <h1>Privacy Policy</h1>
        <p className="legal-date">Last updated: July 2026</p>

        <section>
          <h2>1. What We Collect</h2>
          <p>When you use Janus System, we collect:</p>
          <ul>
            <li><strong>Uploaded images</strong> — the design files you submit for comparison</li>
            <li><strong>Vote data</strong> — a log of pairwise voting decisions, recorded against each project</li>
            <li><strong>Project metadata</strong> — timestamps and identifiers associated with your comparison project</li>
          </ul>
          <p>We do not collect your name, email address, or any account information. Janus System requires no sign-up.</p>
        </section>

        <section>
          <h2>2. How We Use Your Data</h2>
          <p>Your data is used solely to operate the Service — specifically to render the voting arena, calculate Elo rankings, and display your results dashboard. We do not use your data for advertising, profiling, or any purpose beyond running your project.</p>
        </section>

        <section>
          <h2>3. Third-Party Infrastructure</h2>
          <p>Janus System is built on Supabase, a third-party backend provider. Your uploaded images and voting data are stored and processed on Supabase's infrastructure. By using Janus System, you acknowledge that your data is subject to Supabase's own privacy practices. We encourage you to review <a href="https://supabase.com/privacy" target="_blank" rel="noreferrer">Supabase's Privacy Policy</a>.</p>
        </section>

        <section>
          <h2>4. Data Retention</h2>
          <p>Projects and all associated images and vote data are automatically deleted after 7 days. If you wish to request early deletion of your content, contact us with your project link and we will remove it promptly.</p>
        </section>

        <section>
          <h2>5. Privacy of Subjects in Uploaded Content</h2>
          <p>If you upload images containing identifiable individuals, you are solely responsible for obtaining the necessary privacy clearances — such as a signed model release — from those individuals. Janus System does not verify consent for depicted subjects and accepts no liability for content uploaded without proper authorisation.</p>
        </section>

        <section>
          <h2>6. Your Rights</h2>
          <p>You have the right to request deletion of any content you have uploaded. Since Janus System does not require accounts, deletion requests should be submitted via contact with your project link. We will process requests within a reasonable timeframe.</p>
        </section>

        <section>
          <h2>7. Changes to This Policy</h2>
          <p>We may update this Privacy Policy from time to time. Changes will be posted on this page with an updated date.</p>
        </section>
      </div>
    </div>
  );
}