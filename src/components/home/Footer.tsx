import { Link } from "react-router-dom";
import { Shield, Lock, Info, Globe, Instagram, Twitter, Youtube } from "lucide-react";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full bg-white border-t border-gray-100 py-12 md:py-16">
      <div className="container">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand Info */}
          <div className="col-span-1 md:col-span-1 space-y-4">
            <Link to="/" className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-teal-500/20">
                I
              </div>
              <span className="text-xl font-display font-black tracking-tight text-gray-900">
                Influgal
              </span>
            </Link>
            <p className="text-sm text-gray-500 max-w-xs leading-relaxed">
              The premium marketplace connecting world-class brands with verified, performance-driven influencers.
            </p>
            <div className="flex items-center gap-4 pt-2">
              <a href="#" className="text-gray-400 hover:text-pink-500 transition-colors">
                <Instagram size={20} />
              </a>
              <a href="#" className="text-gray-400 hover:text-sky-500 transition-colors">
                <Twitter size={20} />
              </a>
              <a href="#" className="text-gray-400 hover:text-red-500 transition-colors">
                <Youtube size={20} />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="font-display font-bold text-gray-900 text-sm uppercase tracking-wider">
              Platform
            </h4>
            <ul className="space-y-2">
              <li>
                <Link to="/explore" className="text-gray-500 hover:text-teal-600 text-sm transition-colors">
                  Explore Creators
                </Link>
              </li>
              <li>
                <Link to="/explore?tab=campaigns" className="text-gray-500 hover:text-teal-600 text-sm transition-colors">
                  Active Campaigns
                </Link>
              </li>
              <li>
                <Link to="/auth" className="text-gray-500 hover:text-teal-600 text-sm transition-colors font-medium">
                  Join as Influencer
                </Link>
              </li>
              <li>
                <Link to="/auth" className="text-gray-500 hover:text-teal-600 text-sm transition-colors font-medium">
                  Post a Campaign
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div className="space-y-4">
            <h4 className="font-display font-bold text-gray-900 text-sm uppercase tracking-wider">
              Resources
            </h4>
            <ul className="space-y-2">
              <li>
                <a href="#" className="text-gray-500 hover:text-teal-600 text-sm transition-colors">
                  Brand Guidelines
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-500 hover:text-teal-600 text-sm transition-colors">
                  Marketing Hub
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-500 hover:text-teal-600 text-sm transition-colors">
                  Support Center
                </a>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div className="space-y-4">
            <h4 className="font-display font-bold text-gray-900 text-sm uppercase tracking-wider">
              Legal
            </h4>
            <ul className="space-y-2">
              <li>
                <Link 
                  to="/privacy" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-500 hover:text-teal-600 text-sm flex items-center gap-2 transition-colors"
                >
                  <Lock size={14} className="opacity-50" /> Privacy Policy
                </Link>
              </li>
              <li>
                <Link 
                  to="/terms" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-500 hover:text-teal-600 text-sm flex items-center gap-2 transition-colors"
                >
                  <Shield size={14} className="opacity-50" /> Terms of Service
                </Link>
              </li>
              <li>
                <a href="#" className="text-gray-500 hover:text-teal-600 text-sm flex items-center gap-2 transition-colors">
                  <Globe size={14} className="opacity-50" /> Language: English
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-16 pt-8 border-t border-gray-50 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-gray-400">
            © {currentYear} Influgal. All rights reserved. Precise metrics. Real connections.
          </p>
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-1.5 text-[10px] font-bold text-teal-600 uppercase tracking-widest bg-teal-50 px-3 py-1 rounded-full border border-teal-100">
              <div className="h-1 w-1 rounded-full bg-teal-500 animate-pulse" /> Platform Status: Operational
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
