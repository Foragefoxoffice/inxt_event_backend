import nodemailer from 'nodemailer'
import dotenv from 'dotenv'

dotenv.config()

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
})

export async function sendDiagnosticReport({ to, name, organisation, result, aiResult }) {
  const score = Math.round(Object.values(aiResult?.aiCalculatedScores || result.metrics || {}).reduce((a, b) => a + b, 0) / 4)
  
  const mailOptions = {
    from: `"SalesVerse AI" <${process.env.SMTP_USER}>`,
    to,
    subject: `Your Agency Diagnostic Report - ${name}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 12px; overflow: hidden;">
        <div style="background: #002147; padding: 30px; color: white; text-align: center;">
          <h1 style="margin: 0; font-size: 24px;">Agency Health Audit</h1>
          <p style="opacity: 0.8; margin-top: 10px;">Personalized for ${name} @ ${organisation}</p>
        </div>
        
        <div style="padding: 30px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <div style="font-size: 48px; font-weight: 800; color: #002147;">${score}%</div>
            <div style="text-transform: uppercase; font-size: 12px; font-weight: bold; color: #C4962A; letter-spacing: 2px;">Overall Operational Health</div>
          </div>

          <h2 style="color: #002147; border-bottom: 2px solid #F3F4F6; padding-bottom: 10px;">Executive Summary</h2>
          <p style="color: #4B5563; line-height: 1.6;">${aiResult?.summary || 'Your agency report is ready for review.'}</p>

          <h2 style="color: #002147; border-bottom: 2px solid #F3F4F6; padding-bottom: 10px; margin-top: 30px;">Strategic Action Plan</h2>
          <ul style="padding-left: 20px;">
            ${(aiResult?.actions || []).map(action => `
              <li style="margin-bottom: 15px; color: #4B5563;">
                <strong style="color: #002147;">${action.title} (${action.timeframe}):</strong><br/>
                ${action.description}
              </li>
            `).join('')}
          </ul>

          <div style="background: #F9FAFB; border-radius: 8px; padding: 20px; margin-top: 40px; text-align: center;">
            <p style="margin: 0; color: #6B7280; font-size: 14px;">Want to see how SalesVerse can accelerate this plan?</p>
            <a href="https://salesverse.ai/demo" style="display: inline-block; background: #C4962A; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold; margin-top: 15px;">Book a Deep-Dive</a>
          </div>
        </div>
        
        <div style="background: #fdfdfd; padding: 20px; text-align: center; font-size: 12px; color: #9CA3AF; border-top: 1px solid #eee;">
          &copy; 2026 SalesVerse AI Consultant. Generated during Takaful Summit.
        </div>
      </div>
    `
  }

  try {
    const info = await transporter.sendMail(mailOptions)
    console.log('Email sent: %s', info.messageId)
    return info
  } catch (error) {
    console.error('Error sending email:', error)
    throw error
  }
}
