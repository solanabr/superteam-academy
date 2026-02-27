import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

export interface CertificateData {
  id: string;
  courseName: string;
  recipientName: string;
  recipientAddress: string;
  issuedDate: string;
  credentialId: string;
  issuerName: string;
  grade: string;
  xpEarned: number;
  skills: string[];
  verified: boolean;
  onChain: boolean;
  mintAddress?: string;
}

/**
 * Download certificate as JPG image
 */
export async function downloadCertificateAsJPG(elementId: string, filename: string): Promise<void> {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error('Certificate element not found');
  }

  try {
    // Capture the element as canvas
    const canvas = await html2canvas(element, {
      scale: 2, // Higher resolution
      backgroundColor: '#ffffff',
      useCORS: true,
      logging: false,
      windowWidth: element.scrollWidth,
      windowHeight: element.scrollHeight,
    });

    // Convert to JPG and download
    const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
    const link = document.createElement('a');
    link.download = `${filename}.jpg`;
    link.href = dataUrl;
    link.click();
  } catch (error) {
    console.error('Failed to generate JPG:', error);
    throw new Error('Failed to generate certificate image');
  }
}

/**
 * Download certificate as PNG image (higher quality)
 */
export async function downloadCertificateAsPNG(elementId: string, filename: string): Promise<void> {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error('Certificate element not found');
  }

  try {
    const canvas = await html2canvas(element, {
      scale: 2,
      backgroundColor: '#ffffff',
      useCORS: true,
      logging: false,
    });

    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `${filename}.png`;
    link.href = dataUrl;
    link.click();
  } catch (error) {
    console.error('Failed to generate PNG:', error);
    throw new Error('Failed to generate certificate image');
  }
}

/**
 * Download certificate as PDF
 */
export async function downloadCertificateAsPDF(
  elementId: string,
  filename: string,
  certificateData?: CertificateData
): Promise<void> {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error('Certificate element not found');
  }

  try {
    // Capture the element as canvas
    const canvas = await html2canvas(element, {
      scale: 2,
      backgroundColor: '#ffffff',
      useCORS: true,
      logging: false,
    });

    // Calculate PDF dimensions (A4 landscape)
    const imgWidth = 297; // A4 width in mm (landscape)
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    // Create PDF
    const pdf = new jsPDF({
      orientation: imgHeight > imgWidth ? 'portrait' : 'landscape',
      unit: 'mm',
      format: 'a4',
    });

    // Add image to PDF
    const imgData = canvas.toDataURL('image/jpeg', 0.95);

    // Center the image on the page
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    // Scale to fit page with padding
    const padding = 10;
    const availableWidth = pageWidth - padding * 2;
    const availableHeight = pageHeight - padding * 2;

    let finalWidth = availableWidth;
    let finalHeight = (canvas.height * finalWidth) / canvas.width;

    // If height exceeds available height, scale down
    if (finalHeight > availableHeight) {
      finalHeight = availableHeight;
      finalWidth = (canvas.width * finalHeight) / canvas.height;
    }

    const xOffset = (pageWidth - finalWidth) / 2;
    const yOffset = (pageHeight - finalHeight) / 2;

    pdf.addImage(imgData, 'JPEG', xOffset, yOffset, finalWidth, finalHeight);

    // Add metadata if provided
    if (certificateData) {
      pdf.setProperties({
        title: `Certificate - ${certificateData.courseName}`,
        subject: `Course completion certificate for ${certificateData.recipientName}`,
        author: certificateData.issuerName,
        keywords: `certificate, ${certificateData.courseName}, blockchain, solana`,
        creator: 'CapySolBuild Academy',
      });
    }

    // Save PDF
    pdf.save(`${filename}.pdf`);
  } catch (error) {
    console.error('Failed to generate PDF:', error);
    throw new Error('Failed to generate certificate PDF');
  }
}

/**
 * Generate a printable certificate canvas (returns base64)
 */
export async function generateCertificateImage(elementId: string): Promise<string> {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error('Certificate element not found');
  }

  const canvas = await html2canvas(element, {
    scale: 2,
    backgroundColor: '#ffffff',
    useCORS: true,
    logging: false,
  });

  return canvas.toDataURL('image/png');
}
