import fetch from 'node-fetch';
import jwt from 'jsonwebtoken';
import fs from 'fs';

const testPdfGeneration = async () => {
  try {
    // Generate a test JWT token
    const token = jwt.sign({ userId: 'test-user-id' }, process.env.JWT_SECRET || 'your-secret-key', { expiresIn: '1h' });

    const pdfData = {
      summary: 'This is a test summary for the PDF generation.',
      title: 'Test PDF Generation',
      thumbnail: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
      channelTitle: 'Test Channel',
      publishedAt: new Date().toISOString(),
    };

    const response = await fetch('https://backend-notenexus.onrender.com/api/pdf/generate-pdf', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(pdfData),
    });

    if (response.ok) {
      const pdfBuffer = await response.buffer();
      fs.writeFileSync('test.pdf', pdfBuffer);
      console.log('PDF generated successfully: test.pdf');
    } else {
      console.error('Failed to generate PDF:', response.status, await response.text());
    }
  } catch (error) {
    console.error('Error testing PDF generation:', error);
  }
};

testPdfGeneration();
