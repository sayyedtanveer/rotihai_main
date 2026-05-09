import { useEffect } from "react";

export default function PrivacyPolicy() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-2">Privacy Policy</h1>
          <p className="text-orange-100">Effective Date: May 8, 2026</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Introduction */}
        <section className="mb-10">
          <p className="text-slate-700 dark:text-slate-300 text-lg leading-relaxed">
            At <strong>RotiHai</strong>, we are committed to protecting your privacy and ensuring you have a positive experience on our platform. This Privacy Policy explains how we collect, use, and safeguard your personal information.
          </p>
        </section>

        {/* Information We Collect */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
            📋 Information We Collect
          </h2>
          <p className="text-slate-700 dark:text-slate-300 mb-4">
            RotiHai collects customer information such as:
          </p>
          <ul className="list-disc list-inside space-y-2 text-slate-700 dark:text-slate-300 ml-2">
            <li><strong>Name</strong> - To personalize your orders and delivery</li>
            <li><strong>Phone Number</strong> - For order confirmation and delivery communication</li>
            <li><strong>Address</strong> - Required for food delivery to your location</li>
            <li><strong>Order Details</strong> - Items ordered, quantities, and preferences</li>
            <li><strong>Payment Information</strong> - For processing your transactions securely</li>
            <li><strong>Location Data</strong> - To locate delivery personnel and calculate delivery fees</li>
          </ul>
        </section>

        {/* How We Use Your Information */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
            💡 How We Use Your Information
          </h2>
          <p className="text-slate-700 dark:text-slate-300 mb-4">
            Your information is used exclusively for:
          </p>
          <ul className="list-disc list-inside space-y-2 text-slate-700 dark:text-slate-300 ml-2">
            <li>Processing your food orders</li>
            <li>Arranging delivery to your address</li>
            <li>Notifying you about order status and delivery updates</li>
            <li>Processing payments securely</li>
            <li>Improving our services and customer experience</li>
            <li>Responding to customer support inquiries</li>
          </ul>
        </section>

        {/* Data Sharing */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
            🔒 Data Sharing
          </h2>
          <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
            We do <strong>not sell or share</strong> your personal data with third parties. Your information is shared only:
          </p>
          <ul className="list-disc list-inside space-y-2 text-slate-700 dark:text-slate-300 ml-2 mt-4">
            <li><strong>With Food Vendors:</strong> Your delivery address and order details for food preparation</li>
            <li><strong>With Delivery Partners:</strong> Your address and contact details for delivery services</li>
            <li><strong>With Payment Processors:</strong> Only the necessary payment information to process transactions</li>
            <li><strong>As Required by Law:</strong> If legally mandated by authorities</li>
          </ul>
        </section>

        {/* Data Security */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
            🛡️ Data Security
          </h2>
          <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
            Customer information is <strong>securely stored</strong> with industry-standard encryption and security measures. We implement appropriate technical and organizational measures to protect your data from unauthorized access, alteration, or disclosure.
          </p>
        </section>

        {/* Your Rights */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
            ✋ Your Privacy Rights
          </h2>
          <p className="text-slate-700 dark:text-slate-300 mb-4">
            You have the right to:
          </p>
          <ul className="list-disc list-inside space-y-2 text-slate-700 dark:text-slate-300 ml-2">
            <li>Access the personal information we have about you</li>
            <li>Request correction of inaccurate data</li>
            <li>Request deletion of your personal information (subject to legal requirements)</li>
            <li>Opt out of promotional communications</li>
          </ul>
        </section>

        {/* Cookie Policy */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
            🍪 Cookies
          </h2>
          <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
            RotiHai uses cookies and similar technologies to enhance your experience, remember your preferences, and analyze usage patterns. You can control cookie settings in your browser.
          </p>
        </section>

        {/* Changes to Privacy Policy */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
            📝 Changes to This Policy
          </h2>
          <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
            We may update this Privacy Policy from time to time. Changes will be posted on this page with an updated "Effective Date". Your continued use of RotiHai after changes constitute your acceptance of the updated policy.
          </p>
        </section>

        {/* Contact Information */}
        <section className="mb-10 p-6 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
            📞 Contact Us
          </h2>
          <p className="text-slate-700 dark:text-slate-300 mb-3">
            For privacy-related concerns, questions, or to exercise your rights, please contact us at:
          </p>
          <p className="text-lg font-semibold">
            <a 
              href="mailto:support@rotihai.com" 
              className="text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 underline"
            >
              support@rotihai.com
            </a>
          </p>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-3">
            We will respond to your inquiry within 7 business days.
          </p>
        </section>

        {/* Final Note */}
        <section className="border-t border-slate-200 dark:border-slate-700 pt-6 mt-10">
          <p className="text-sm text-slate-600 dark:text-slate-400 text-center">
            By using RotiHai, you agree to this Privacy Policy. If you have any questions or concerns, please don't hesitate to reach out.
          </p>
        </section>
      </div>

      {/* Footer spacing */}
      <div className="h-12"></div>
    </div>
  );
}
