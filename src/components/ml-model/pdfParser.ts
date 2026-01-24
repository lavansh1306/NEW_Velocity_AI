import * as pdfjsLib from 'pdfjs-dist';

// 1. DYNAMIC WORKER CONFIGURATION
// This ensures the CDN worker version matches EXACTLY your installed 'npm install pdfjs-dist' version.
// We use unpkg as it supports the specific build structure reliably.
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.js`;

export const extractTextFromPDF = async (file: File): Promise<string> => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    
    // 2. Load the Document
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    
    let fullText = '';

    // 3. Extract Text Page by Page
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      
      // Join tokens with space (simple extraction)
      const pageText = textContent.items
        // @ts-ignore - 'str' exists on TextItem, but TS types can be tricky with pdfjs-dist versions
        .map((item: any) => item.str)
        .join(' ');

      fullText += `Page ${i}: ${pageText}\n\n`;
    }

    if (!fullText.trim()) {
      throw new Error("PDF contains no selectable text (it might be an image scan).");
    }

    return fullText;

  } catch (error) {
    console.error("PDF Extraction Failed:", error);
    throw new Error("Could not parse PDF. Check console for CORS or Version errors.");
  }
};