const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

/**
 * Creates and configures the email transporter
 * @returns {Object} - Configured nodemailer transporter
 */
function createTransporter() {
  return nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
}

/**
 * Sends email with proposal PDF to student and mentor
 * @param {Object} proposalData - The proposal data
 * @param {String} pdfPath - Path to the generated PDF file
 * @param {String} aiFeedback - AI-generated feedback
 * @returns {Promise<boolean>} - Success status
 */
async function sendProposalEmail(proposalData, pdfPath, aiFeedback) {
  try {
    // Check if PDF exists
    if (!fs.existsSync(pdfPath)) {
      console.error(`PDF file not found at path: ${pdfPath}`);
      return false;
    }

    const transporter = createTransporter();
    
    // Extract summary feedback for email body
    const summaryFeedback = extractSummaryFeedback(aiFeedback);
    
    // Create email content
    const emailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 650px; margin: 0 auto;">
        <div style="background-color: #0369A1; color: white; padding: 20px; text-align: center;">
          <h1>Project Proposal Feedback</h1>
        </div>
        
        <div style="padding: 20px; border: 1px solid #e5e7eb; background-color: white;">
          <p>Dear ${proposalData.student_name},</p>
          
          <p>Thank you for submitting your project proposal titled: <strong>"${proposalData.project_title}"</strong> (Project ID: ${proposalData.project_id}).</p>
          
          <p>We're pleased to provide you with AI-generated feedback on your proposal. This feedback is designed to help you refine and strengthen your project plan.</p>
          
          <div style="margin: 20px 0; padding: 15px; background-color: #f0f9ff; border-left: 4px solid #0369A1;">
            <h3>Feedback Summary:</h3>
            ${summaryFeedback}
          </div>
          
          <p>Please find attached a comprehensive PDF document containing your complete proposal along with detailed AI feedback and recommendations.</p>
          
          <p>If you have any questions or need further clarification regarding the feedback, please contact your supervisor or department administrator.</p>
          
          <p>Best regards,<br>
          Student Project Portal Team</p>
        </div>
        
        <div style="padding: 10px; text-align: center; font-size: 12px; color: #6b7280;">
          <p>This is an automated email. Please do not reply directly to this message.</p>
        </div>
      </div>
    `;
    
    // Define recipients
    const recipients = [proposalData.student_email];
    if (proposalData.supervisor_email) {
      recipients.push(proposalData.supervisor_email);
    }
    
    // Send email
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || '"Student Portal" <noreply@example.com>',
      to: recipients.join(', '),
      subject: `Project Proposal Feedback - ${proposalData.project_id}`,
      html: emailContent,
      attachments: [
        {
          filename: `Project_Proposal_${proposalData.project_id}.pdf`,
          path: pdfPath,
          contentType: 'application/pdf'
        }
      ]
    });
    
    console.log('Email sent successfully:', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}

/**
 * Extracts a summary from AI feedback for email content
 * @param {String} aiFeedback - The full AI feedback text
 * @returns {String} - HTML formatted summary
 */
function extractSummaryFeedback(aiFeedback) {
  try {
    if (!aiFeedback) {
      return '<p>Feedback analysis complete. Please check the attached PDF for details.</p>';
    }
    
    // Extract overall assessment section
    let overallAssessment = '';
    const overallMatch = aiFeedback.match(/1\.\s+OVERALL ASSESSMENT[\s\S]*?(?=\n\s*\n|\n\d+\.)/i);
    if (overallMatch && overallMatch[0]) {
      overallAssessment = overallMatch[0].replace(/1\.\s+OVERALL ASSESSMENT\s*:?\s*/i, '').trim();
    }
    
    // Extract strengths section
    let strengths = [];
    const strengthsMatch = aiFeedback.match(/2\.\s+STRENGTHS[\s\S]*?(?=\n\s*\n|\n\d+\.)/i);
    if (strengthsMatch && strengthsMatch[0]) {
      const strengthsText = strengthsMatch[0].replace(/2\.\s+STRENGTHS\s*:?\s*/i, '').trim();
      strengths = strengthsText.split('\n').filter(line => line.trim().length > 0 && line.match(/^-|^\d+\./));
    }
    
    // Extract areas for improvement section
    let improvements = [];
    const improvementsMatch = aiFeedback.match(/3\.\s+AREAS FOR IMPROVEMENT[\s\S]*?(?=\n\s*\n|\n\d+\.)/i);
    if (improvementsMatch && improvementsMatch[0]) {
      const improvementsText = improvementsMatch[0].replace(/3\.\s+AREAS FOR IMPROVEMENT\s*:?\s*/i, '').trim();
      improvements = improvementsText.split('\n').filter(line => line.trim().length > 0 && line.match(/^-|^\d+\./));
    }
    
    // Format summary HTML
    let summaryHtml = '';
    
    if (overallAssessment) {
      summaryHtml += `<p><strong>Overall:</strong> ${overallAssessment}</p>`;
    }
    
    if (strengths.length > 0) {
      summaryHtml += `<p><strong>Key Strengths:</strong></p><ul>`;
      strengths.forEach(strength => {
        const cleanStrength = strength.replace(/^-|\d+\.\s*/, '').trim();
        summaryHtml += `<li>${cleanStrength}</li>`;
      });
      summaryHtml += `</ul>`;
    }
    
    if (improvements.length > 0) {
      summaryHtml += `<p><strong>Areas for Improvement:</strong></p><ul>`;
      improvements.forEach(improvement => {
        const cleanImprovement = improvement.replace(/^-|\d+\.\s*/, '').trim();
        summaryHtml += `<li>${cleanImprovement}</li>`;
      });
      summaryHtml += `</ul>`;
    }
    
    summaryHtml += `<p><em>For complete feedback and detailed recommendations, please review the attached PDF document.</em></p>`;
    
    return summaryHtml;
  } catch (error) {
    console.error('Error extracting feedback summary:', error);
    return '<p>Feedback analysis complete. Please check the attached PDF for details.</p>';
  }
}

module.exports = {
  sendProposalEmail
};