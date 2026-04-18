import { ChevronLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";

const Terms = () => {
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
              Terms of Service
            </h1>
            <p className="text-lg text-muted-foreground font-medium">
              Effective Date: March 25, 2026
            </p>
          </header>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 border-b border-gray-100 pb-3 mb-6">
              1. Acceptance of Terms
            </h2>
            <p>
              By accessing or using the Influgal platform, you agree to be bound by these 
              Terms of Service and all applicable laws and regulations. If you do not 
              agree with any of these terms, you are prohibited from using or accessing 
              this site.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 border-b border-gray-100 pb-3 mb-6">
              2. Use License
            </h2>
            <p>
              Permission is granted to use Influgal for the purpose of connecting brands 
              and influencers for marketing campaigns. This license is limited to 
              personal or business networking and does NOT permit:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Modifying or copying site materials for unauthorized use.</li>
              <li>Using materials for any commercial purpose (except specifically through marketplace functionality).</li>
              <li>Attempting to decompile or reverse engineer any software on the Influgal site.</li>
              <li>Removing any copyright or other proprietary notations from the materials.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 border-b border-gray-100 pb-3 mb-6">
              3. Verification and Professional Conduct
            </h2>
            <p>
              Influgal relies on transparency and authenticity. By using our platform:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Influencers agree to provide accurate social media metrics via our branded link sync.</li>
              <li>Brands agree to provide accurate campaign details and budget expectations.</li>
              <li>Users must not engage in fraudulent behavior, spam, or harassment.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 border-b border-gray-100 pb-3 mb-6">
              4. Disclaimer
            </h2>
            <p>
              Influgal provides a marketplace connection service. We do not guarantee 
              the performance of any marketing campaign or the specific results of 
              any influencer collaboration. The materials on Influgal are provided "as is."
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 border-b border-gray-100 pb-3 mb-6">
              5. Limitations of Liability
            </h2>
            <p>
              In no event shall Influgal or its suppliers be liable for any damages 
              (including, without limitation, damages for loss of data or profit, or 
              due to business interruption) arising out of the use or inability to 
              use the materials on Influgal's website.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 border-b border-gray-100 pb-3 mb-6">
              6. Content Ownership
            </h2>
            <p>
              Users retain ownership of the content they post on Influgal. However, 
              by posting content, you grant Influgal a non-exclusive, worldwide, 
              royalty-free license to use, display, and distribute said content as 
              needed for the operation and promotion of the marketplace.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 border-b border-gray-100 pb-3 mb-6">
              7. Governing Law
            </h2>
            <p>
              Any claim relating to Influgal's website shall be governed by the 
              laws without regard to its conflict of law provisions.
            </p>
          </section>

          <section className="bg-gray-50 rounded-3xl p-8 border border-gray-100 text-center">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Service Support
            </h2>
            <p className="text-gray-600 mb-0">
              Questions about our terms? Contact <strong>legal@influgal.com</strong>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Terms;
