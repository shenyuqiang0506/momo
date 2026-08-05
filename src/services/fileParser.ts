import * as pdfjsLib from 'pdfjs-dist';

export interface ParseResult {
  text: string;
  hash: string;
  charCount: number;
}

async function calculateHash(content: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(content);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

function cleanText(text: string): string {
  const lines = text.split('\n');
  const cleanedLines = lines
    .map(line => line.trim())
    .filter(line => line.length > 0);
  return cleanedLines.join('\n\n');
}

export async function parsePDF(file: File): Promise<ParseResult> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let fullText = '';

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item: any) => item.str)
      .join(' ');
    fullText += pageText + '\n';
  }

  const cleanedText = cleanText(fullText);
  const hash = await calculateHash(cleanedText);

  return {
    text: cleanedText,
    hash,
    charCount: cleanedText.length,
  };
}

export async function parseTXT(file: File): Promise<ParseResult> {
  const text = await file.text();
  const cleanedText = cleanText(text);
  const hash = await calculateHash(cleanedText);

  return {
    text: cleanedText,
    hash,
    charCount: cleanedText.length,
  };
}

export async function parseFile(file: File): Promise<ParseResult> {
  const extension = file.name.split('.').pop()?.toLowerCase() || '';

  switch (extension) {
    case 'pdf':
      return await parsePDF(file);
    case 'txt':
      return await parseTXT(file);
    default:
      throw new Error(`Unsupported file type: ${extension}`);
  }
}

export async function parseText(text: string, title: string): Promise<ParseResult> {
  const cleanedText = cleanText(text);
  const hash = await calculateHash(cleanedText);

  return {
    text: cleanedText,
    hash,
    charCount: cleanedText.length,
  };
}
