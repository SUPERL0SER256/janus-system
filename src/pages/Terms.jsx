import { Link } from 'react-router-dom';
import Footer from '../components/Footer';

export default function Terms() {
  return (
    <div className="flex flex-col items-center p-6 min-h-screen w-full max-w-4xl mx-auto">
      <header className="w-full flex items-baseline gap-4 mt-8 mb-12">
        <Link to="/" className="text-xl tracking-[0.2em] font-light text-white/80 hover:text-white transition-colors">JANUS</Link>
        <span className="text-xs font-mono text-white/20 uppercase">Terms of Service</span>
      </header>

      <div className="liquid-glass w-full p-8 md:p-12 rounded-[2rem] text-white/70 font-light leading-relaxed space-y-8 mb-16">
        <section>
          <h2 className="text-lg font-medium text-white/90 mb-3 tracking-wide">Acceptance of Terms</h2>
          <p className="text-sm">By accessing or using the Janus System, you agree to be bound by these Terms of Service.</p>
        </section>

        <section>
          <h2 className="text-lg font-medium text-white/90 mb-3 tracking-wide">User Responsibilities & Content Guidelines</h2>
          <ul className="list-disc pl-5 space-y-2 text-sm">
            <li>You are solely responsible for the iterations you upload to the platform.</li>
            <li>You may not upload content that is illegal, explicit, or infringes on the intellectual property rights of others.</li>
            <li>We reserve the right to remove any project or image at any time, for any reason, without notice.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-medium text-white/90 mb-3 tracking-wide">Intellectual Property</h2>
          <p className="text-sm mb-2"><strong>Your Designs:</strong> You retain all ownership rights to the designs and iterations you upload. The Janus System claims no ownership over your creative work.</p>
          <p className="text-sm"><strong>License to Display:</strong> By uploading images, you grant the Janus System a temporary, non-exclusive license to host and display those images to voters strictly for the purpose of operating the comparison arena.</p>
        </section>

        <section>
          <h2 className="text-lg font-medium text-white/90 mb-3 tracking-wide">Disclaimer & Governing Law</h2>
          <p className="text-sm mb-2">The Janus System is provided on an "AS IS" and "AS AVAILABLE" basis. Sumer and the Janus System team shall not be liable for any data loss or damages arising from your use of the platform.</p>
          <p className="text-sm">These terms shall be governed by and construed in accordance with the laws of India, specifically within the jurisdiction of Roorkee, Uttarakhand.</p>
        </section>
      </div>

      <Footer />
    </div>
  );
}