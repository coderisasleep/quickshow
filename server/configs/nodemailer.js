import nodemailer from 'nodemailer'

let cachedTransporter = null;

function getTransporter() {
    if (!cachedTransporter) {
        const host = process.env.SMTP_HOST || "smtp-relay.brevo.com";
        const port = Number(process.env.SMTP_PORT) || 587;
        const secure = process.env.SMTP_SECURE === "true" || port === 465;

        cachedTransporter = nodemailer.createTransport({
            host,
            port,
            secure,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });
    }
    return cachedTransporter;
}

const sendEmail = async ({ to, subject, body, html, text }) => {
    const missingConfig = ["SMTP_USER", "SMTP_PASS", "SENDER_EMAIL"].filter((key) => !process.env[key]);
    if (missingConfig.length) {
        const errorMsg = `Missing Brevo SMTP configuration: ${missingConfig.join(", ")}. Please configure them in your environment variables.`;
        console.error(`[Nodemailer] ${errorMsg}`);
        throw new Error(errorMsg);
    }

    const htmlContent = html || body;
    const fromAddress = process.env.SENDER_NAME 
        ? `"${process.env.SENDER_NAME}" <${process.env.SENDER_EMAIL}>`
        : `"QuickShow" <${process.env.SENDER_EMAIL}>`;

    const transporter = getTransporter();
    const mailOptions = {
        from: fromAddress,
        to,
        subject,
        html: htmlContent,
        text: text,
    };

    const response = await transporter.sendMail(mailOptions);
    console.log(`[Nodemailer] Email sent successfully to ${to} (MessageId: ${response.messageId})`);
    return response;
};

export default sendEmail;