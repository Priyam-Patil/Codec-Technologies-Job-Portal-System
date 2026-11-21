import { parentPort, workerData } from 'node:worker_threads';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';

let document;
try {
  document = await getDocument({ data: new Uint8Array(workerData), isEvalSupported: false, useSystemFonts: false, disableFontFace: true, verbosity: 0 }).promise;
  if (document.numPages > 20) throw new Error('Page limit');
  let text = '';
  for (let page = 1; page <= document.numPages; page++) {
    const content = await (await document.getPage(page)).getTextContent();
    text += content.items.map(item => item.str || '').join(' ') + '\n';
    if (text.length > 100000) break;
  }
  parentPort.postMessage({ text: text.slice(0, 100000), status: text.trim().length >= 30 ? 'processed' : 'unreadable' });
} catch (error) {
  parentPort.postMessage({ text: '', status: error.name === 'InvalidPDFException' ? 'invalid' : error.name === 'PasswordException' ? 'encrypted' : 'unreadable' });
} finally {
  await document?.destroy();
}
