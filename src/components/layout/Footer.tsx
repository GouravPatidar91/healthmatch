
import React from "react";
import { Link } from "react-router-dom";
import { Heart, Mail, Phone, MapPin, Shield, FileText, Users, Settings } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-slate-900 text-slate-300 mt-auto">
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Brand Section */}
          <div className="space-y-3">
            <Link to="/dashboard" className="flex items-center space-x-2 group">
              <div className="p-1.5 bg-blue-600 rounded-lg group-hover:bg-blue-700 transition-colors">
                <Heart className="text-white h-4 w-4" />
              </div>
              <span className="font-bold text-lg text-white">
                HealthMatch
              </span>
            </Link>
            <p className="text-slate-400 text-xs leading-relaxed">
              Your trusted healthcare companion for symptom analysis, 
              appointment booking, and emergency assistance.
            </p>
            <div className="flex items-center gap-2 text-xs">
              <Shield className="h-3 w-3 text-green-400" />
              <span className="text-slate-400">HIPAA Compliant</span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h3 className="font-semibold text-white text-sm">Quick Links</h3>
            <ul className="space-y-1">
              <li>
                <Link to="/dashboard" className="text-slate-400 hover:text-white transition-colors text-xs">
                  Dashboard
                </Link>
              </li>
              <li>
                <Link to="/health-check" className="text-slate-400 hover:text-white transition-colors text-xs">
                  Health Check
                </Link>
              </li>
              <li>
                <Link to="/appointments" className="text-slate-400 hover:text-white transition-colors text-xs">
                  Appointments
                </Link>
              </li>
              <li>
                <Link to="/medical-reports" className="text-slate-400 hover:text-white transition-colors text-xs">
                  Medical Reports
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div className="space-y-3">
            <h3 className="font-semibold text-white text-sm">Support</h3>
            <ul className="space-y-1">
              <li>
                <Link to="/settings" className="text-slate-400 hover:text-white transition-colors text-xs flex items-center gap-1">
                  <Settings className="h-2.5 w-2.5" />
                  Help Center
                </Link>
              </li>
              <li>
                <Link to="/privacy-policy" className="text-slate-400 hover:text-white transition-colors text-xs flex items-center gap-1">
                  <Shield className="h-2.5 w-2.5" />
                  Privacy Policy
                </Link>
              </li>
              <li>
                <a href="#" className="text-slate-400 hover:text-white transition-colors text-xs flex items-center gap-1">
                  <FileText className="h-2.5 w-2.5" />
                  Terms of Service
                </a>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="space-y-3">
            <h3 className="font-semibold text-white text-sm">Contact</h3>
            <ul className="space-y-2">
              <li className="flex items-center gap-2 text-xs">
                <Phone className="h-3 w-3 text-blue-400" />
                <span className="text-slate-400">1-800-HEALTH</span>
              </li>
              <li className="flex items-center gap-2 text-xs">
                <Mail className="h-3 w-3 text-blue-400" />
                <span className="text-slate-400">support@healthmatch.com</span>
              </li>
              <li className="flex items-start gap-2 text-xs">
                <MapPin className="h-3 w-3 text-blue-400 mt-0.5" />
                <span className="text-slate-400">
                  123 Healthcare Ave<br />
                  New York, NY 10001
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-slate-800 mt-4 pt-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-2">
            <p className="text-slate-400 text-xs">
              © {new Date().getFullYear()} HealthMatch. All rights reserved.
            </p>
            <div className="flex items-center gap-4 text-xs">
              <Link to="/privacy-policy" className="text-slate-400 hover:text-white transition-colors">
                Privacy Policy
              </Link>
              <a href="#" className="text-slate-400 hover:text-white transition-colors">
                Terms of Service
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
