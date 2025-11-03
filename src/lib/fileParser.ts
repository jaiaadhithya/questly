// Supabase disabled for local-only mode
import * as pdfjsLib from 'pdfjs-dist';
// Use local-bundled worker instead of CDN to avoid network fetch
// Vite will bundle this and return a URL string
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import mammoth from 'mammoth';
import JSZip from 'jszip';

// Interface for parsed content
export interface ParsedContent {
  text: string;
  fileName: string;
  fileType: string;
}

/**
 * Parse uploaded files and extract text content
 * @param files Array of files to parse
 * @param studyId The study ID to associate with the parsed content
 * @returns Promise with array of parsed content
 */
export const parseFiles = async (
  files: File[],
  studyId: string
): Promise<ParsedContent[]> => {
  const parsedContents: ParsedContent[] = [];

  for (const file of files) {
    try {
      // Determine file type
      const fileType = getFileType(file.name);
      
      // Extract text based on file type
      let text = '';
      
      if (fileType === 'pdf') {
        text = await extractTextFromPDF(file);
      } else if (fileType === 'ppt' || fileType === 'pptx') {
        text = await extractTextFromPPT(file);
      } else if (fileType === 'docx') {
        text = await extractTextFromDOCX(file);
      } else if (fileType === 'txt') {
        text = await extractTextFromTXT(file);
      }
      
      // Add to parsed contents
      parsedContents.push({
        text,
        fileName: file.name,
        fileType: fileType
      });
      
    } catch (error) {
      console.error(`Error parsing file ${file.name}:`, error);
    }
  }
  
  return parsedContents;
};

/**
 * Determine file type from file name
 */
const getFileType = (fileName: string): string => {
  const extension = fileName.split('.').pop()?.toLowerCase() || '';
  
  if (extension === 'pdf') return 'pdf';
  if (extension === 'ppt' || extension === 'pptx') return 'ppt';
  if (extension === 'doc' || extension === 'docx') return 'docx';
  if (extension === 'txt') return 'txt';
  
  return extension;
};

/**
 * Extract text from PDF file
 * Simplified implementation for development
 */
const extractTextFromPDF = async (file: File): Promise<string> => {
  try {
    try {
      // Ensure pdf.js uses the locally bundled worker (no external network)
      (pdfjsLib as any).GlobalWorkerOptions.workerSrc = pdfWorkerUrl;
    } catch {}
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;

    let textContent = '';
    const maxPages = pdf.numPages;
    for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const content = await page.getTextContent();
      const strings = content.items.map((item: any) => ('str' in item ? item.str : '')).filter(Boolean);
      textContent += strings.join(' ') + '\n';
    }
    return textContent.trim();
  } catch (err) {
    console.error('PDF parsing failed:', err);
    return `[PDF Parsing Failed] ${file.name}`;
  }
};

/**
 * Extract text from PowerPoint file
 * Simplified implementation for development
 */
const extractTextFromPPT = async (file: File): Promise<string> => {
  try {
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext !== 'pptx') {
      // Basic fallback for legacy .ppt (binary) unsupported in browser
      return `[PPT Unsupported] ${file.name}: Please upload PPTX for best results.`;
    }
    const buf = await file.arrayBuffer();
    const zip = await JSZip.loadAsync(buf);
    let text = '';
    // Read slide XML files
    const slideFiles = Object.keys(zip.files)
      .filter((p) => p.startsWith('ppt/slides/slide') && p.endsWith('.xml'))
      .sort((a, b) => a.localeCompare(b));

    for (const path of slideFiles) {
      const xml = await zip.files[path].async('string');
      // Extract text from <a:t> tags and general text nodes
      const tagTextMatches = Array.from(xml.matchAll(/<a:t>([^<]*)<\/a:t>/g)).map((m) => m[1]);
      if (tagTextMatches.length) {
        text += tagTextMatches.join(' ') + '\n';
      } else {
        // Fallback: strip tags and keep raw text
        const stripped = xml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
        text += stripped + '\n';
      }
    }
    return text.trim();
  } catch (err) {
    console.error('PPTX parsing failed:', err);
    return `[PPTX Parsing Failed] ${file.name}`;
  }
};

/**
 * Extract text from Word document
 * Simplified implementation for development
 */
const extractTextFromDOCX = async (file: File): Promise<string> => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value.trim();
  } catch (err) {
    console.error('DOCX parsing failed:', err);
    return `[DOCX Parsing Failed] ${file.name}`;
  }
};

/**
 * Extract text from plain text file
 */
const extractTextFromTXT = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      if (e.target?.result) {
        resolve(e.target.result as string);
      } else {
        reject(new Error('Failed to read text file'));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Error reading text file'));
    };
    
    reader.readAsText(file);
  });
};