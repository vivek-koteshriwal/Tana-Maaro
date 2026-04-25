import nodemailer from "nodemailer";

const GMAIL_USER = process.env.GMAIL_USER;
const GMAIL_PASS = process.env.GMAIL_PASS;

interface PartnershipRequestPayload {
    name: string;
    email: string;
    message: string;
    company?: string;
    phone?: string;
}

export async function sendMail({ to, subject, html }: { to: string, subject: string, html: string }) {
    if (!GMAIL_USER || !GMAIL_PASS) {
        console.warn("Mail credentials missing. Sending simulated email to:", to);
        console.log("Subject:", subject);
        console.log("Body:", html);
        return;
    }

    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: GMAIL_USER,
            pass: GMAIL_PASS,
        },
    });

    try {
        await transporter.sendMail({
            from: `"Tana Maaro Alerts" <${GMAIL_USER}>`,
            to,
            subject,
            html,
        });
        console.log("Email sent successfully to:", to);
    } catch (error) {
        console.error("Failed to send email:", error);
    }
}

export async function sendPartnershipAlert(data: PartnershipRequestPayload) {
    const adminEmail = process.env.ADMIN_EMAIL || GMAIL_USER;
    if (!adminEmail) return;

    await sendMail({
        to: adminEmail,
        subject: `New Partnership Request: ${data.company || data.name}`,
        html: `
            <div style="font-family: sans-serif; max-width: 600px; border: 1px solid #eee; padding: 20px;">
                <h2 style="color: #dc2626;">New Partnership Protocol Initiated</h2>
                <p>A new partnership request has been received from the website.</p>
                <hr />
                <p><strong>Name:</strong> ${data.name}</p>
                <p><strong>Company/Brand:</strong> ${data.company || "N/A"}</p>
                <p><strong>Email:</strong> ${data.email}</p>
                <p><strong>Phone:</strong> ${data.phone || "N/A"}</p>
                <p><strong>Message/Proposal:</strong></p>
                <p style="background: #f9f9f9; padding: 10px; border-radius: 5px;">${data.message}</p>
                <hr />
                <p style="font-size: 12px; color: #666;">View this in your Tana Maaro Admin Dashboard to take action.</p>
            </div>
        `,
    });
}

export async function sendPasswordResetEmail(email: string, token: string) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const resetUrl = `${appUrl}/reset-password?token=${encodeURIComponent(token)}`;

    await sendMail({
        to: email,
        subject: "Reset your Tana Maaro password",
        html: `
            <div style="font-family: sans-serif; max-width: 600px; border: 1px solid #eee; padding: 20px;">
                <h2 style="color: #dc2626;">Reset your password</h2>
                <p>We received a request to reset your Tana Maaro password.</p>
                <p>
                    <a
                        href="${resetUrl}"
                        style="display: inline-block; padding: 12px 18px; border-radius: 8px; background: #dc2626; color: #fff; text-decoration: none; font-weight: 700;"
                    >
                        Reset Password
                    </a>
                </p>
                <p>If you did not request this, you can safely ignore this email.</p>
                <p style="font-size: 12px; color: #666;">This link expires in 1 hour.</p>
            </div>
        `,
    });
}
