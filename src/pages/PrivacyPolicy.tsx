
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Lock, Eye, Users, FileText, Phone, Mail } from "lucide-react";

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="max-w-4xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <Shield className="h-12 w-12 text-blue-600 mr-3" />
            <h1 className="text-4xl font-bold text-slate-900">Privacy Policy</h1>
          </div>
          <p className="text-lg text-slate-600">
            Your privacy and data security are our top priorities
          </p>
          <p className="text-sm text-slate-500 mt-2">
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </div>

        {/* Introduction */}
        <Card className="modern-card mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Eye className="h-6 w-6 text-blue-600" />
              Introduction
            </CardTitle>
          </CardHeader>
          <CardContent className="prose prose-slate max-w-none">
            <p className="text-slate-700 leading-relaxed">
              HealthMatch ("we," "our," or "us") is committed to protecting your privacy and ensuring the security of your personal health information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our healthcare platform and services.
            </p>
          </CardContent>
        </Card>

        {/* Information We Collect */}
        <Card className="modern-card mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <FileText className="h-6 w-6 text-green-600" />
              Information We Collect
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold text-slate-900 mb-2">Personal Information</h3>
              <ul className="list-disc list-inside text-slate-700 space-y-1">
                <li>Name, email address, phone number, and date of birth</li>
                <li>Emergency contact information</li>
                <li>Authentication credentials and account preferences</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 mb-2">Health Information</h3>
              <ul className="list-disc list-inside text-slate-700 space-y-1">
                <li>Symptoms, health assessments, and medical reports</li>
                <li>Appointment history and healthcare provider interactions</li>
                <li>Medical test results and health check data</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 mb-2">Technical Information</h3>
              <ul className="list-disc list-inside text-slate-700 space-y-1">
                <li>Device information, IP address, and browser type</li>
                <li>Usage patterns and interaction data</li>
                <li>Location data (when explicitly consented for emergency services)</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* How We Use Your Information */}
        <Card className="modern-card mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Users className="h-6 w-6 text-purple-600" />
              How We Use Your Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc list-inside text-slate-700 space-y-2">
              <li>Provide personalized healthcare services and symptom analysis</li>
              <li>Facilitate appointment scheduling with healthcare providers</li>
              <li>Enable emergency response services and medical assistance</li>
              <li>Improve our platform through analytics and user feedback</li>
              <li>Communicate important health information and service updates</li>
              <li>Ensure platform security and prevent fraudulent activities</li>
            </ul>
          </CardContent>
        </Card>

        {/* Data Protection & Security */}
        <Card className="modern-card mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Lock className="h-6 w-6 text-red-600" />
              Data Protection & Security
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-slate-700">
              We implement industry-standard security measures to protect your personal health information:
            </p>
            <ul className="list-disc list-inside text-slate-700 space-y-1">
              <li>End-to-end encryption for all data transmission</li>
              <li>Secure database storage with regular backups</li>
              <li>Multi-factor authentication and access controls</li>
              <li>Regular security audits and vulnerability assessments</li>
              <li>HIPAA-compliant data handling procedures</li>
            </ul>
          </CardContent>
        </Card>

        {/* Your Rights */}
        <Card className="modern-card mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Shield className="h-6 w-6 text-blue-600" />
              Your Rights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-700 mb-4">You have the right to:</p>
            <ul className="list-disc list-inside text-slate-700 space-y-1">
              <li>Access and review your personal health information</li>
              <li>Request corrections to inaccurate data</li>
              <li>Delete your account and associated data</li>
              <li>Opt-out of non-essential communications</li>
              <li>Download your health data in a portable format</li>
              <li>File complaints regarding our privacy practices</li>
            </ul>
          </CardContent>
        </Card>

        {/* Third-Party Services */}
        <Card className="modern-card mb-8">
          <CardHeader>
            <CardTitle>Third-Party Services</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-700 mb-4">
              We may share your information with trusted third parties only when necessary:
            </p>
            <ul className="list-disc list-inside text-slate-700 space-y-1">
              <li>Healthcare providers for appointment and treatment purposes</li>
              <li>Emergency services when you request emergency assistance</li>
              <li>Service providers who assist in platform operations (under strict confidentiality agreements)</li>
              <li>Legal authorities when required by law or to protect user safety</li>
            </ul>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card className="modern-card mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Phone className="h-6 w-6 text-green-600" />
              Contact Us
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-700 mb-4">
              If you have questions about this Privacy Policy or our privacy practices, please contact us:
            </p>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-slate-500" />
                <span className="text-slate-700">privacy@healthmatch.com</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-slate-500" />
                <span className="text-slate-700">1-800-HEALTH (1-800-432-5844)</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Updates */}
        <Card className="modern-card">
          <CardHeader>
            <CardTitle>Policy Updates</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-700">
              We may update this Privacy Policy periodically to reflect changes in our practices or legal requirements. 
              We will notify you of any material changes through email or prominent notices on our platform. 
              Your continued use of HealthMatch after such modifications constitutes acceptance of the updated Privacy Policy.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
