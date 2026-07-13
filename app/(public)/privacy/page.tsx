import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | TherapistCEU.com",
  description: "Learn about how TherapistCEU collects, uses, and safeguards your information.",
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-20 sm:px-6 sm:py-28">
      <div className="text-center">
        <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
          Privacy Policy
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Last updated: July 13, 2026
        </p>
      </div>

      <div className="mt-16 rounded-2xl border border-border bg-card p-8 shadow-sm sm:p-12 space-y-8 text-foreground">
        <section className="space-y-3">
          <h2 className="text-2xl font-bold text-foreground">1. Introduction</h2>
          <p className="text-muted-foreground leading-relaxed">
            Welcome to TherapistCEU.com. We are committed to protecting your personal information and your right to privacy. If you have any questions or concerns about our policy, or our practices with regards to your personal information, please contact us at support@therapistceu.com.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-bold text-foreground">2. Information We Collect</h2>
          <p className="text-muted-foreground leading-relaxed">
            We collect personal information that you voluntarily provide to us when you register on our website, express an interest in obtaining information about us or our products and services, or otherwise when you contact us.
          </p>
          <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
            <li>
              <strong>Account Data:</strong> For trainers, we collect name, email address, password, billing details (via Stripe), and training listing details.
            </li>
            <li>
              <strong>Directory Usage:</strong> For therapists, we do not require account creation. We only collect anonymous searching behavior to optimize results.
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-bold text-foreground">3. How We Use Your Information</h2>
          <p className="text-muted-foreground leading-relaxed">
            We use personal information collected via our website for a variety of business purposes described below. We process your personal information for these purposes in reliance on our legitimate business interests, in order to enter into or perform a contract with you, with your consent, and/or for compliance with our legal obligations.
          </p>
          <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
            <li>To facilitate account creation and logon process.</li>
            <li>To post and manage training listings on our directory.</li>
            <li>To send administrative and subscription information to you.</li>
            <li>To process payments via secure third-party payment processors (Stripe).</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-bold text-foreground">4. Information Sharing</h2>
          <p className="text-muted-foreground leading-relaxed">
            We only share information with your consent, to comply with laws, to provide you with services, to protect your rights, or to fulfill business obligations. Training details you post publicly are visible to anyone visiting our directory.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-bold text-foreground">5. Data Security</h2>
          <p className="text-muted-foreground leading-relaxed">
            We use appropriate administrative, technical, and physical security measures to help protect your personal information. Please remember that no transmission over the Internet can be guaranteed to be 100% secure.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-bold text-foreground">6. Contact Us</h2>
          <p className="text-muted-foreground leading-relaxed">
            If you have questions or comments about this policy, you may email us at:
          </p>
          <a
            href="mailto:support@therapistceu.com"
            className="inline-block text-primary font-medium hover:underline focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-md"
          >
            support@therapistceu.com
          </a>
        </section>
      </div>
    </div>
  );
}
