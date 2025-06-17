import express from 'express';
import { createPDF } from '../services/pdfService.js';
import auth from '../middleware/auth.js';
import path from 'path';

const router = express.Router();

// Generate PDF from summary
router.post('/generate-pdf', auth, async (req, res) => {
  try {
    const { summary, title, thumbnail, channelTitle, publishedAt } = req.body;
    
    if (!summary || !title) {
      return res.status(400).json({ error: 'Summary and title are required' });
    }

    // Create PDF
    const pdfPath = await createPDF({
      summary,
      title,
      thumbnail,
      channelTitle,
      publishedAt
    });

    // Send PDF file
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf"`);
    res.sendFile(pdfPath, {}, (err) => {
      if (err) {
        console.error('Error sending PDF:', err);
        res.status(500).json({ error: 'Failed to send PDF' });
      }
    });
  } catch (error) {
    console.error('Error generating PDF:', error);
    res.status(500).json({ error: 'Failed to generate PDF' });
  }
});

export default router;
