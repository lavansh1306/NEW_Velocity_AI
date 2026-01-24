import * as pdfjsLib from 'pdfjs-dist';

// --- THE FIX: Import worker directly from node_modules as a URL resource ---
// The '?url' suffix tells Vite not to bundle this, but to give us the final path.
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;

export const extractTextFromPDF = async (file: File): Promise<string> => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    
    // Load the Document
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    
    let fullText = '';
    const totalPages = pdf.numPages;

    // Loop through pages
    for (let i = 1; i <= totalPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      
      // Extract text items
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');

      fullText += pageText + '\n';
    }

    if (!fullText.trim()) {
      throw new Error("PDF text is empty. It might be a scanned image.");
    }

    return fullText;

  } catch (error) {
    console.error("PDF Parse Error:", error);
    throw new Error("Failed to read PDF. Ensure it is a valid text-based PDF.");
  }
};