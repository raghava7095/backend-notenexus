import { PDFDocument } from 'pdf-lib';
import { createCanvas, loadImage } from 'canvas';
import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';
import { fileURLToPath } from 'url';

// Get the current module's directory
const __dirname = fileURLToPath(new URL('.', import.meta.url));

// Create a temporary directory for PDFs if it doesn't exist
const PDF_DIR = join(__dirname, '..', 'tmp', 'pdfs');
mkdir(PDF_DIR, { recursive: true }).catch(console.error);

async function createPDF(data) {
  try {
    // Create a new PDF document
    const pdfDoc = await PDFDocument.create();
    
    // Add a page
    let page = pdfDoc.addPage([600, 800]);
    const { width, height } = page.getSize();
    const margin = 50;
    const maxWidth = width - margin * 2;

    // --- 1. Wrap and Draw Title ---
    const titleFont = await pdfDoc.embedFont('Helvetica-Bold');
    const titleFontSize = 24;
    const titleLineHeight = 30;
    let currentY = height - 70;

    const titleWords = data.title.split(' ');
    let titleLine = '';
    const titleLines = [];

    for (const word of titleWords) {
        const testLine = titleLine + (titleLine ? ' ' : '') + word;
        const testWidth = titleFont.widthOfTextAtSize(testLine, titleFontSize);
        if (testWidth > maxWidth) {
            titleLines.push(titleLine);
            titleLine = word;
        } else {
            titleLine = testLine;
        }
    }
    titleLines.push(titleLine);

    for (const line of titleLines) {
        const lineWidth = titleFont.widthOfTextAtSize(line, titleFontSize);
        const lineX = (width - lineWidth) / 2;
        page.drawText(line, { x: lineX, y: currentY, font: titleFont, size: titleFontSize });
        currentY -= titleLineHeight;
    }

    currentY -= 10; // Space after title

    // --- 2. Add Channel and Date ---
    const detailsFont = await pdfDoc.embedFont('Helvetica');
    const detailsFontSize = 12;
    const detailsText = `${data.channelTitle} · ${new Date(data.publishedAt).toLocaleDateString()}`;
    const detailsWidth = detailsFont.widthOfTextAtSize(detailsText, detailsFontSize);
    const detailsX = (width - detailsWidth) / 2;
    page.drawText(detailsText, {
      x: detailsX,
      y: currentY,
      size: detailsFontSize,
      font: detailsFont,
    });

    currentY -= 20; // Space after details

    // --- 3. Add Thumbnail ---
    let thumbnailY = currentY;
    if (data.thumbnail) {
      try {
        const canvas = createCanvas(200, 150);
        const ctx = canvas.getContext('2d');
        const img = await loadImage(data.thumbnail);
        ctx.drawImage(img, 0, 0, 200, 150);
        
        const thumbnailImage = await pdfDoc.embedPng(canvas.toBuffer());
        const thumbnailWidth = 200;
        const thumbnailHeight = 150;
        const thumbnailX = (width - thumbnailWidth) / 2;
        thumbnailY = currentY - thumbnailHeight; // Position thumbnail
        
        if (thumbnailY < margin) { // Check if thumbnail fits
            page = pdfDoc.addPage();
            currentY = page.getSize().height - margin;
            thumbnailY = currentY - thumbnailHeight;
        }
        
        page.drawImage(thumbnailImage, {
          x: thumbnailX,
          y: thumbnailY,
          width: thumbnailWidth,
          height: thumbnailHeight,
        });
      } catch (imgError) {
        console.error("Could not load or embed thumbnail:", imgError);
        // If thumbnail fails, we just skip it and continue.
        // thumbnailY is already set to currentY, so the summary will just start there.
      }
    }

    // --- 4. Add Summary with Text Wrapping ---
    const summaryFont = await pdfDoc.embedFont('Helvetica');
    const summaryFontSize = 12;
    const summaryLineHeight = 18;
    currentY = thumbnailY - 40; // Start below the thumbnail (or details)

    const paragraphs = data.summary.split(/\n/g);

    for (const paragraph of paragraphs) {
        if (currentY < margin) {
            page = pdfDoc.addPage();
            currentY = page.getSize().height - margin;
        }
        
        if (paragraph.trim() === '') {
            currentY -= summaryLineHeight * 0.5;
            continue;
        }

        const words = paragraph.split(' ');
        let line = '';

        for (const word of words) {
            const testLine = line + (line ? ' ' : '') + word;
            const testWidth = summaryFont.widthOfTextAtSize(testLine, summaryFontSize);

            if (testWidth > maxWidth) {
                page.drawText(line, { x: margin, y: currentY, font: summaryFont, size: summaryFontSize });
                currentY -= summaryLineHeight;
                line = word;

                if (currentY < margin) {
                    page = pdfDoc.addPage();
                    currentY = page.getSize().height - margin;
                }
            } else {
                line = testLine;
            }
        }

        page.drawText(line, { x: margin, y: currentY, font: summaryFont, size: summaryFontSize });
        currentY -= summaryLineHeight * 1.5; // Extra space after each paragraph
    }

    // --- 5. Save PDF ---
    const pdfBytes = await pdfDoc.save();
    
    const timestamp = Date.now();
    const filename = `${timestamp}_${data.title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
    const filePath = join(PDF_DIR, filename);
    
    await writeFile(filePath, pdfBytes);
    
    return filePath;
  } catch (error) {
    console.error('Error creating PDF:', error);
    throw error;
  }
}

export { createPDF };
