import { ChevronLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";

const Privacy = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white text-gray-900 selection:bg-teal-500/30">
      <Navbar />
      
      <div className="container max-w-4xl py-12 md:py-20">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => navigate(-1)}
          className="mb-8 -ml-2 text-muted-foreground hover:text-teal-600 transition-colors"
        >
          <ChevronLeft className="mr-1 h-4 w-4" />
          Back
        </Button>

        <div className="space-y-10 prose prose-teal max-w-none prose-headings:font-display prose-headings:font-bold prose-p:text-gray-600 prose-li:text-gray-600">
          <header className="mb-12">
            <h1 className="text-4xl md:text-5xl font-display font-black tracking-tight text-gray-900 mb-4">
              Privacy Policy
            </h1>
            <p className="text-lg text-muted-foreground font-medium">
              Last Updated: March 25, 2026
            </p>
          </header>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 border-b border-gray-100 pb-3 mb-6">
              1. Introduction
            </h2>
            <p>
              At Influgal, your privacy is a priority. This Privacy Policy explains how we collect, 
              use, and protect your personal information when you use our platform to connect brands 
              and influencers.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 border-b border-gray-100 pb-3 mb-6">
              2. Information We Collect
            </h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-bold text-gray-800">Account Information</h3>
                <p>
                  When you register, we collect your name, email address, and profile details. 
                  For influencers, this includes social media handles and niche categories. For brands, 
                  this includes company details and campaign requirements.
                </p>
              </div>
              <div>
                <h3 className="font-bold text-gray-800">Social Media Metrics</h3>
                <p>
                  To provide our core service, we collect publicly available social media engagement 
                  data (follower counts, engagement rates) through verified sync processes.
                </p>
              </div>
              <div>
                <h3 className="font-bold text-gray-800">Usage Data</h3>
                <p>
                  We automatically collect information on how you interact with our platform, 
                  including IP addresses, device types, and browser settings.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 border-b border-gray-100 pb-3 mb-6">
              3. How We Use Your Information
            </h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>To provide and maintain the Influgal marketplace.</li>
              <li>To facilitate verification and authenticity of social media profiles.</li>
              <li>To match influencers with relevant brand campaigns.</li>
              <li>To improve our platform features and user experience.</li>
              <li>To communicate important updates, security alerts, and support messages.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 border-b border-gray-100 pb-3 mb-6">
              4. Data Sharing and Disclosure
            </h2>
            <p>
              We do not sell your personal data. Your information is shared only in the 
              following circumstances:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Between brands and influencers specifically for campaign fulfillment.</li>
              <li>Publicly on the platform for profile discoverability (limited to social metrics and public bios).</li>
              <li>With service providers (like Supabase and Apify) necessary for platform operation.</li>
              <li>When required by law to protect our rights or comply with judicial proceedings.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 border-b border-gray-100 pb-3 mb-6">
              5. Data Security
            </h2>
            <p>
              We implement industry-standard security measures to protect your data. All user 
              information is stored in encrypted databases provided by Supabase. However, no 
              electronic transmission is 100% secure, and we cannot guarantee absolute security.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 border-b border-gray-100 pb-3 mb-6">
              6. Your Rights
            </h2>
            <p>
              You have the right to access, correct, or delete your personal information at 
              any time via your account settings. If you wish to permanently delete your 
              account and all associated data, please contact us at support@influgal.com.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 border-b border-gray-100 pb-3 mb-6">
              7. Cookies
            </h2>
            <p>
              We use cookies to maintain your session and remember your preferences. You can 
              manage cookie settings in your browser, though some platform features may 
              not function correctly without them.
            </p>
          </section>

          <section className="bg-gray-50 rounded-3xl p-8 border border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Contact Us
            </h2>
            <p className="text-gray-600 mb-0">
              If you have any questions about this Privacy Policy, please reach out to our 
              privacy team at <strong>privacy@influgal.com</strong>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Privacy;
