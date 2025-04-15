const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

/**
 * Generates a PDF document from proposal data and AI feedback
 * @param {Object} proposalData - The complete proposal data
 * @param {String} aiFeedback - The AI-generated feedback
 * @returns {Promise<String>} - Path to the generated PDF file
 */
async function generateProposalPDF(proposalData, aiFeedback) {
  return new Promise((resolve, reject) => {
    try {
      // Create PDF document
      const doc = new PDFDocument({
        margins: { top: 50, bottom: 50, left: 50, right: 50 },
        info: {
          Title: `Project Proposal - ${proposalData.project_id}`,
          Author: proposalData.student_name,
          Subject: 'Project Proposal with AI Feedback',
          Keywords: 'proposal, student, feedback'
        }
      });

      // Ensure uploads directory exists
      const pdfDir = path.join(__dirname, '../uploads/pdfs');
      if (!fs.existsSync(pdfDir)) {
        fs.mkdirSync(pdfDir, { recursive: true });
      }
      
      // Define PDF output path
      const timestamp = new Date().getTime();
      const pdfPath = path.join(pdfDir, `proposal_${proposalData.project_id}_${timestamp}.pdf`);
      const stream = fs.createWriteStream(pdfPath);
      
      // Handle stream errors
      stream.on('error', (err) => {
        console.error('Error writing PDF stream:', err);
        reject(err);
      });
      
      // When stream is closed, resolve promise with file path
      stream.on('close', () => {
        resolve(pdfPath);
      });
      
      // Pipe the PDF document to the write stream
      doc.pipe(stream);

      // Add header with logo (commented out, add if you have a logo)
      /*
      doc.image(path.join(__dirname, '../public/logo.png'), {
        width: 150,
        align: 'center'
      });
      */

      // Add title
      doc.fontSize(24)
         .font('Helvetica-Bold')
         .text('PROJECT PROPOSAL REVIEW', { align: 'center' })
         .moveDown(0.5);
      
      // Add project ID and date
      doc.fontSize(12)
         .font('Helvetica')
         .text(`Project ID: ${proposalData.project_id}`, { align: 'center' })
         .text(`Generated on: ${new Date().toLocaleDateString()}`, { align: 'center' })
         .moveDown(1);

      // Horizontal divider
      doc.moveTo(50, doc.y)
         .lineTo(doc.page.width - 50, doc.y)
         .stroke()
         .moveDown(1);

      // Student Information Section
      doc.fontSize(16)
         .font('Helvetica-Bold')
         .text('STUDENT INFORMATION', { underline: true })
         .moveDown(0.5);
      
      doc.fontSize(12)
         .font('Helvetica')
         .text(`Student Name: ${proposalData.student_name}`)
         .text(`Student ID: ${proposalData.student_id}`)
         .text(`SAP Code: ${proposalData.sap_code}`)
         .text(`College: ${proposalData.college_name}`)
         .text(`Email: ${proposalData.student_email}`)
         .text(`Course/Department: ${proposalData.course || 'N/A'}`)
         .text(`Supervisor: ${proposalData.supervisor_name || 'N/A'}`)
         .text(`Supervisor Email: ${proposalData.supervisor_email}`)
         .moveDown(1);

      // Project Details Section
      doc.fontSize(16)
         .font('Helvetica-Bold')
         .text('PROJECT DETAILS', { underline: true })
         .moveDown(0.5);
      
      // Project Title
      doc.fontSize(14)
         .font('Helvetica-Bold')
         .text('Title:')
         .fontSize(12)
         .font('Helvetica')
         .text(proposalData.project_title)
         .moveDown(0.5);
      
      // Abstract
      doc.fontSize(14)
         .font('Helvetica-Bold')
         .text('Abstract:')
         .fontSize(12)
         .font('Helvetica')
         .text(proposalData.abstract)
         .moveDown(0.5);
      
      // Add a page break to prevent content from being cut off
      doc.addPage();
      
      // Introduction
      doc.fontSize(14)
         .font('Helvetica-Bold')
         .text('Introduction/Background:')
         .fontSize(12)
         .font('Helvetica')
         .text(proposalData.introduction)
         .moveDown(0.5);
      
      // Objectives
      doc.fontSize(14)
         .font('Helvetica-Bold')
         .text('Objectives:')
         .fontSize(12)
         .font('Helvetica')
         .text(proposalData.objectives)
         .moveDown(0.5);
      
      // Methodology
      doc.fontSize(14)
         .font('Helvetica-Bold')
         .text('Methodology:')
         .fontSize(12)
         .font('Helvetica')
         .text(proposalData.methodology)
         .moveDown(0.5);
      
      // Check if we need to add a page break
      if (doc.y > doc.page.height - 200) {
        doc.addPage();
      }
      
      // Timeline
      doc.fontSize(14)
         .font('Helvetica-Bold')
         .text('Timeline/Schedule:')
         .fontSize(12)
         .font('Helvetica')
         .text(proposalData.timeline || 'Not provided')
         .moveDown(0.5);
      
      // Expected Outcomes
      doc.fontSize(14)
         .font('Helvetica-Bold')
         .text('Expected Outcomes/Deliverables:')
         .fontSize(12)
         .font('Helvetica')
         .text(proposalData.outcomes)
         .moveDown(0.5);
      
      // Add another page break before budget section
      doc.addPage();
      
      // Budget Section
      doc.fontSize(16)
         .font('Helvetica-Bold')
         .text('BUDGET INFORMATION', { underline: true })
         .moveDown(0.5);
      
      // Check if there are budget items
      if (proposalData.budget_items && proposalData.budget_items.length > 0) {
        // Create a table-like structure for budget items
        const tableTop = doc.y;
        const tableLeft = 50;
        const colWidths = [200, 100, 200]; // Item, Cost, Justification
        const rowHeight = 20;
        
        // Table header
        doc.fontSize(12)
           .font('Helvetica-Bold');
        doc.text('Item', tableLeft, tableTop);
        doc.text('Cost', tableLeft + colWidths[0], tableTop);
        doc.text('Justification', tableLeft + colWidths[0] + colWidths[1], tableTop);
        
        // Draw header underline
        doc.moveTo(tableLeft, tableTop + rowHeight - 5)
           .lineTo(tableLeft + colWidths[0] + colWidths[1] + colWidths[2], tableTop + rowHeight - 5)
           .stroke();
        
        let currentY = tableTop + rowHeight;
        
        // Table rows
        doc.fontSize(11)
           .font('Helvetica');
        
        for (const item of proposalData.budget_items) {
          // Check if we need a page break
          if (currentY > doc.page.height - 100) {
            doc.addPage();
            currentY = 50;
            
            // Redraw header on new page
            doc.fontSize(12)
               .font('Helvetica-Bold');
            doc.text('Item', tableLeft, currentY);
            doc.text('Cost', tableLeft + colWidths[0], currentY);
            doc.text('Justification', tableLeft + colWidths[0] + colWidths[1], currentY);
            
            doc.moveTo(tableLeft, currentY + rowHeight - 5)
               .lineTo(tableLeft + colWidths[0] + colWidths[1] + colWidths[2], currentY + rowHeight - 5)
               .stroke();
            
            currentY += rowHeight;
            doc.fontSize(11)
               .font('Helvetica');
          }
          
          doc.text(item.item_description, tableLeft, currentY, { width: colWidths[0] - 10 });
          doc.text(`$${parseFloat(item.cost).toFixed(2)}`, tableLeft + colWidths[0], currentY);
          doc.text(item.justification, tableLeft + colWidths[0] + colWidths[1], currentY, { width: colWidths[2] - 10 });
          
          // Calculate the height of this row based on the content
          const textHeight = Math.max(
            doc.heightOfString(item.item_description, { width: colWidths[0] - 10 }),
            doc.heightOfString(item.justification, { width: colWidths[2] - 10 })
          );
          
          currentY += textHeight + 10;
          
          // Add a separator line
          doc.moveTo(tableLeft, currentY - 5)
             .lineTo(tableLeft + colWidths[0] + colWidths[1] + colWidths[2], currentY - 5)
             .stroke();
        }
        
        // Total budget
        currentY += rowHeight;
        doc.fontSize(12)
           .font('Helvetica-Bold')
           .text(`Total Budget: $${parseFloat(proposalData.budget_total).toFixed(2)}`, tableLeft, currentY);
        
      } else {
        doc.fontSize(12)
           .font('Helvetica')
           .text('No budget items provided.')
           .moveDown(0.5);
        
        doc.text(`Total Budget: $${parseFloat(proposalData.budget_total || 0).toFixed(2)}`)
           .moveDown(1);
      }
      
      // Check if we need to add a page break
      if (doc.y > doc.page.height - 200) {
        doc.addPage();
      } else {
        doc.moveDown(1);
      }
      
      // Stakeholders Section
      doc.fontSize(16)
         .font('Helvetica-Bold')
         .text('STAKEHOLDERS', { underline: true })
         .moveDown(0.5);
      
      if (proposalData.stakeholders && proposalData.stakeholders.length > 0) {
        for (const stakeholder of proposalData.stakeholders) {
          doc.fontSize(12)
             .font('Helvetica-Bold')
             .text(`${stakeholder.name}:`)
             .fontSize(12)
             .font('Helvetica')
             .text(`Role: ${stakeholder.role}`)
             .moveDown(0.5);
        }
      } else {
        doc.fontSize(12)
           .font('Helvetica')
           .text('No stakeholders listed.')
           .moveDown(1);
      }
      
      // References Section (if any)
      if (proposalData.references) {
        // Check if we need a page break
        if (doc.y > doc.page.height - 200) {
          doc.addPage();
        } else {
          doc.moveDown(1);
        }
        
        doc.fontSize(16)
           .font('Helvetica-Bold')
           .text('REFERENCES', { underline: true })
           .moveDown(0.5)
           .fontSize(12)
           .font('Helvetica')
           .text(proposalData.references);
      }
      
      // Add a page break before AI feedback section
      doc.addPage();
      
      // AI Feedback Section
      doc.fontSize(20)
         .font('Helvetica-Bold')
         .fillColor('rgb(44, 102, 154)') // Blue color for feedback section
         .text('AI-GENERATED FEEDBACK', { align: 'center' })
         .moveDown(0.5);
      
      doc.fontSize(12)
         .font('Helvetica')
         .fillColor('black')
         .text('The following feedback was generated by an AI assistant to help improve this proposal:')
         .moveDown(1);
      
      // Format AI feedback (assuming it's plain text with sections)
      if (aiFeedback) {
        // Split by numbered sections (1., 2., etc.)
        const feedbackLines = aiFeedback.split('\n');
        
        for (const line of feedbackLines) {
          // Check for section headings (e.g., "1. OVERALL ASSESSMENT")
          if (/^\d+\.\s+[A-Z\s]+:?/.test(line) || /^[A-Z\s]+:$/.test(line)) {
            doc.fontSize(14)
               .font('Helvetica-Bold')
               .text(line)
               .moveDown(0.5);
          } 
          // Check for subsection headings (e.g., "- Project Title:")
          else if (/^\s*-\s+[A-Za-z\s]+:/.test(line)) {
            doc.fontSize(12)
               .font('Helvetica-Bold')
               .text(line)
               .moveDown(0.2);
          }
          // Regular text
          else {
            // Check if we need a page break for long content
            if (doc.y > doc.page.height - 100) {
              doc.addPage();
            }
            
            doc.fontSize(12)
               .font('Helvetica')
               .text(line)
               .moveDown(0.2);
          }
        }
      } else {
        doc.text('No AI feedback available.');
      }
      
      // Add footer with page numbers
      const totalPages = doc.bufferedPageRange().count;
      for (let i = 0; i < totalPages; i++) {
        doc.switchToPage(i);
        
        // Add page number at the bottom
        doc.fontSize(10)
           .text(
             `Page ${i + 1} of ${totalPages}`,
             50,
             doc.page.height - 50,
             { align: 'center' }
           );
      }
      
      // Finalize the PDF and end the stream
      doc.end();

    } catch (error) {
      console.error('Error generating PDF:', error);
      reject(error);
    }
  });
}

module.exports = {
  generateProposalPDF
};