import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Privacy Policy | Tanamaaro",
    description: "Tanamaaro Privacy Policy.",
};

const POLICY_TEXT = `PRIVACY POLICY


Tanamaaro is committed to protecting your privacy. This Privacy Policy explains what personal information we collect, how we use it, who we share it with, and the rights available to you. By using the Platform, you consent to the data practices described in this Policy.

1. INFORMATION WE COLLECT
1.1 Content You Post
When you post on Tanamaaro, we collect the Content itself (roasts, memes, confessions, media uploads), your username or handle (if provided), college name (if provided), and whether you have chosen to post anonymously.
1.2 Event & Competition Submissions
For event entries and creator programs, we collect your name or creator name, Instagram handle or other social links, college name, content uploads, and any additional information provided in application forms.
1.3 Automatically Collected Technical Data
Like all websites, we automatically collect certain technical information when you use the Platform:
	•	IP address and approximate location (city/state level)
	•	Device type, browser, and operating system
	•	Pages visited, time spent, scroll depth, and clicks
	•	Cookies and similar tracking identifiers
1.4 Engagement & Interaction Data
We track how you interact with Content on the Platform, including reactions, content viewed, filters used, and categories browsed. This data is used to improve content recommendations and platform features.

2. HOW WE USE YOUR INFORMATION
2.1 Platform Operations
	•	Displaying your Content on the Platform
	•	Moderating Content for compliance with these Terms and Community Guidelines
	•	Organizing, categorizing, and tagging posts
	•	Tracking engagement metrics (views, reactions, shares)
2.2 Content Featuring & Promotion
By posting on Tanamaaro, you consent to your Content being featured on our social media channels and promotional materials (subject to the license in Section 5.2 of the Terms of Use). If you do not want your Content to be featured externally, please do not post it.
2.3 Platform Improvement
	•	Analyzing usage trends to improve the user experience
	•	Developing new features based on user behavior
	•	Preventing spam, abuse, and policy violations
	•	Diagnosing technical issues and fixing bugs
2.4 Communications
	•	Notifying you about events, competitions, and platform updates
	•	Contacting event participants and prize winners
	•	Responding to support requests and queries
You may opt out of non-essential communications at any time by contacting privacy@tanamaaro.com. We may still send essential service-related messages.

3. HOW WE SHARE YOUR INFORMATION

Tanamaaro does not sell your personal data to third parties. Period.

3.1 Public Content
Any Content you post without selecting the anonymous option is public. This means it is visible to anyone on the internet, may be indexed by search engines, and can be shared, screenshotted, or saved by other users. Please exercise caution before posting personally identifying information.
3.2 Trusted Service Providers
We use carefully selected third-party providers to operate the Platform. These may include cloud hosting providers, analytics platforms (e.g. Google Analytics), email/communication services, and payment processors for prize distribution. All service providers are contractually required to protect your data and use it solely for specified purposes.
3.3 Brand Partners
For sponsored events or brand collaborations, we may share your name and contact details (e.g. Instagram handle) with relevant partners — but only with your explicit prior consent.
3.4 Legal Compliance
We will disclose your information when required to do so by law, court order, or regulatory authority. We will also disclose information to prevent, investigate, or address illegal activity, fraud, or threats to safety.
3.5 Business Transfers
If Tanamaaro is acquired, merged, or undergoes a change of ownership, your information may be transferred to the successor entity. We will notify you of any such change via the Platform or by email.

4. YOUR RIGHTS & CHOICES
	•	Access & Portability: Request a copy of all personal data we hold about you by emailing privacy@tanamaaro.com.
	•	Deletion: Request deletion of your account and associated data. Note: Content already featured publicly cannot be recalled from third-party platforms.
	•	Correction: If any of your information is inaccurate, request a correction via email.
	•	Opt-Out: Opt out of non-essential marketing and event communications at any time.
	•	GDPR (European Users): You have additional rights including objection to processing and the right to lodge a complaint with your local supervisory authority.
	•	CCPA (California Users): You have the right to know, delete, and opt out of the sale of personal information (we do not sell personal data).

5. DATA SECURITY
Tanamaaro employs industry-standard security measures including encryption in transit (HTTPS/TLS), secure server infrastructure, and role-based access controls to protect your data.

No system is entirely immune to breaches. In the event of a security incident affecting your personal data, we will notify you promptly in accordance with applicable law.

Note: Posting publicly means accepting the inherent risks of public content. Do not share sensitive personal information in your posts.

6. COOKIES & TRACKING
We use cookies and similar technologies to maintain sessions, remember preferences, conduct analytics, and surface relevant content. You can manage cookie preferences in your browser settings, though some Platform features may not function correctly if cookies are disabled.

7. CHILDREN'S PRIVACY

Tanamaaro is intended for users aged 13 and above.

We do not knowingly collect personal information from children under 13. If we discover that a user is under 13, their account and data will be deleted immediately.

Parents or guardians who believe their child may be using Tanamaaro should contact us at privacy@tanamaaro.com.

8. INTERNATIONAL USERS & DATA TRANSFERS
Tanamaaro is operated from India. If you access the Platform from outside India, your data may be transferred to and processed in India or other countries where our service providers operate. By using the Platform, you consent to this transfer.

We comply with applicable data protection laws, including the Digital Personal Data Protection Act 2023 (India), GDPR for European users, and CCPA for California residents.

9. DATA RETENTION
We retain your personal data for as long as your account is active or as needed to provide our services. Upon account deletion, we will delete or anonymize your personal data within a reasonable period, subject to legal retention obligations and our rights in respect of Content already publicly featured.

10. CHANGES TO THIS POLICY
We may update this Privacy Policy periodically. The updated version will be posted on this page with a revised 'Last Updated' date. For material changes affecting your rights, we will notify you directly via email or platform notification. Continued use of the Platform after changes constitutes acceptance of the updated Policy.

11. CONTACT US
For any privacy-related questions, requests, or concerns:

	•	Privacy inquiries: privacy@tanamaaro.com
	•	Legal matters: legal@tanamaaro.com
	•	General support: support@tanamaaro.com
	•	Instagram: @tanamaaro


— Team Tanamaaro
We built Tanamaaro to give creators a stage — not to be creepy about your data.

`;

export default function PrivacyPage() {
    return (
        <div className="min-h-screen arena-bg">
            <div className="mx-auto max-w-5xl px-4 py-10 md:px-6 md:py-16">
                <section className="overflow-hidden rounded-[28px] border border-white/[0.08] bg-[#141414] shadow-[0_24px_80px_rgba(0,0,0,0.28)]">
                    <div className="h-1.5 w-full bg-gradient-to-r from-[#FF3B3B] via-[#FF8E84] to-transparent" />
                    <div className="px-6 py-6 md:px-8 md:py-8">
                        <pre className="whitespace-pre-wrap break-words font-manrope text-[14px] font-medium leading-7 text-[#F1F1F1] md:text-[15px] md:leading-8">
                            {POLICY_TEXT}
                        </pre>
                    </div>
                </section>
            </div>
        </div>
    );
}
