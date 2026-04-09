import Tesseract from 'tesseract.js';

/**
 * Runs OCR on a base64/dataURL image and returns an array of task strings.
 * Each non-empty line in the image becomes a candidate task.
 * @param {string} imageDataUrl - data URL from FileReader
 * @param {function} onProgress - optional callback(0-100)
 * @returns {Promise<string[]>}
 */
export async function extractTasksFromImage(imageDataUrl, onProgress) {
  const result = await Tesseract.recognize(imageDataUrl, 'eng', {
    logger: ({ status, progress }) => {
      if (status === 'recognizing text' && onProgress) {
        onProgress(Math.round(progress * 100));
      }
    },
  });

  const raw = result.data.text;
  return parseLines(raw);
}

/**
 * Splits OCR text into clean task strings.
 * Strips bullets, dashes, checkboxes, numbering, and blank lines.
 */
function parseLines(text) {
  return text
    .split('\n')
    .map(line =>
      line
        .replace(/^[\s\-•·▪▸►*>]+/, '')   // leading bullets / dashes
        .replace(/^\[[ xX]\]\s*/, '')        // [ ] or [x] checkboxes
        .replace(/^\d+[.)]\s*/, '')          // 1. or 1) numbering
        .trim()
    )
    .filter(line => line.length >= 3);       // drop empty / noise lines
}
