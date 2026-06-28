import { Link } from 'react-router-dom';
import Footer from '../components/Footer';

export default function Privacy() {
  return (
    <div className="flex flex-col items-center p-6 min-h-screen w-full max-w-4xl mx-auto">
      <header className="w-full flex items-baseline gap-4 mt-8 mb-12">
        <Link to="/" className="text-xl tracking-[0.2em] font-light text-white/80 hover:text-white transition-colors">JANUS</Link>
        <span className="text-xs font-mono text-white/20 uppercase">Privacy Policy</span>
      </header>

      <div className="liquid-glass w-full p-8 md:p-12 rounded-[2rem] text-white/70 font-light leading-relaxed space-y-8 mb-16">
        <section>
          <h2 className="text-lg font-medium text-white/90 mb-3 tracking-wide">Information We Collect</h2>
          <ul className="list-disc pl-5 space-y-2 text-sm">
            <li><strong>Uploaded Content:</strong> When a project is initiated, we collect and store the image files (JPG, PNG, WEBP) uploaded to our servers.</li>
            <li><strong>Voting Data:</strong> We collect anonymous interaction data when users vote in the comparison arena.</li>
            <li><strong>Usage Data:</strong> Standard web routing data may be temporarily processed by our hosting provider.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-medium text-white/90 mb-3 tracking-wide">How We Use Your Information</h2>
          <p className="text-sm">Data is strictly used to operate the Janus System, calculate Elo scores, and display comparative rankings.</p>
        </section>

        <section>
          <h2 className="text-lg font-medium text-white/90 mb-3 tracking-wide">Third-Party Services</h2>
          <p className="text-sm">Your data is processed by our secure infrastructure partners: Vercel (Hosting) and Supabase (Database & Storage).</p>
        </section>

        <section>
          <h2 className="text-lg font-medium text-white/90 mb-3 tracking-wide">Data Retention and Deletion</h2>
          <p className="text-sm">The Janus System is designed to be self-cleaning. Projects, associated image files, and voting data are automatically and permanently deleted from our active database after 7 days.</p>
        </section>
      </div>

      <Footer />
    </div>
  );
}