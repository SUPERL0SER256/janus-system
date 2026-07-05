import { Link } from 'react-router-dom';
import './legal.css';

export default function Terms() {
  return (
    <div className="legal-page">
      <div className="legal-inner">
        <Link to="/" className="legal-back">← Back</Link>
        <h1>Terms of Service & Acceptable Use Policy</h1>
        <p className="legal-date">Last updated: July 2026</p>

        <section>
          <h2>1. Agreement to Terms</h2>
          <p>By accessing or using Janus System ("the Service"), you agree to be bound by these Terms of Service. If you do not agree, do not use the Service.</p>
        </section>

        <section>
          <h2>2. Content Ownership & Licensing</h2>
          <p>You retain full ownership of any images you upload to Janus System. By uploading content, you grant Janus System a limited, non-exclusive, royalty-free licence to store, display, and process your images solely for the purpose of operating your comparison project — specifically, rendering the voting arena and calculating Elo rankings.</p>
          <p>This licence expires when your project data is deleted in accordance with our retention policy. We do not claim ownership of your content, sell it, or use it for any purpose beyond operating the Service.</p>
        </section>

        <section>
          <h2>3. Prohibited Content</h2>
          <p>You may not upload content that:</p>
          <ul>
            <li>Infringes any copyright, trademark, patent, or other intellectual property right belonging to a third party</li>
            <li>Contains third-party watermarks or branding without authorisation from the rights holder</li>
            <li>Depicts identifiable individuals without their explicit written consent (e.g. a signed model release)</li>
            <li>Contains unauthorised background characters whose likeness has not been cleared</li>
            <li>Constitutes malicious synthetic media or deepfakes intended to deceive, defame, or harm</li>
            <li>Is obscene, pornographic, sexually explicit, or depicts minors in any inappropriate context</li>
            <li>Promotes hatred, discrimination, or violence against any individual or group</li>
            <li>Contains malware, viruses, or any code designed to harm systems or users</li>
            <li>Facilitates or depicts illegal activity of any kind</li>
            <li>Violates any applicable local, national, or international law or regulation</li>
          </ul>
        </section>

        <section>
          <h2>4. Moderation & Removal Rights</h2>
          <p>Janus System reserves the right to remove any uploaded content and terminate access to the Service at any time, for any reason, without prior notice — particularly where content violates these terms or is otherwise harmful, deceptive, or inappropriate. We are not obligated to provide a reason for removal.</p>
        </section>

        <section>
          <h2>5. Your Responsibilities</h2>
          <p>By uploading content you confirm that:</p>
          <ul>
            <li>You own the content or hold all necessary rights, licences, and permissions to upload and share it</li>
            <li>You have obtained any required consents from identifiable individuals depicted in the content</li>
            <li>Your use of the Service complies with all applicable laws</li>
          </ul>
          <p>You are solely responsible for your uploaded content. Janus System is not liable for any content submitted by users.</p>
        </section>

        <section>
          <h2>6. Limitation of Liability</h2>
          <p>Janus System is provided "as is" without warranties of any kind. To the fullest extent permitted by law, we disclaim all liability for any damages arising from your use of the Service, including but not limited to loss of data, loss of profits, or any indirect or consequential damages.</p>
        </section>

        <section>
          <h2>7. Changes to These Terms</h2>
          <p>We may update these Terms from time to time. Continued use of the Service after changes are posted constitutes your acceptance of the revised Terms.</p>
        </section>

        <section>
          <h2>8. Contact</h2>
          <p>If you believe content on Janus System infringes your rights or violates these Terms, contact us and we will investigate promptly.</p>
        </section>
      </div>
    </div>
  );
}