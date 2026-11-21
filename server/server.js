import 'dotenv/config';
import './config/instrument.js';
import { pathToFileURL } from 'node:url';
import connectDB from './config/db.js';
import connectCloudinary from './config/cloudinary.js';
import { createApp } from './app.js';
import { databaseDiagnostic } from './utils/databaseDiagnostic.js';

connectCloudinary();
// Lazy connection runs inside Express, after CORS, including on failure.
const app = createApp({ connectDatabase: connectDB });
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    await connectDB();
    app.listen(process.env.PORT || 5000, () => console.log('InsiderJobs API started'));
  } catch (error) { const diagnostic = databaseDiagnostic(error); console.error(`API startup failed: ${diagnostic.code}. ${diagnostic.message}`); process.exitCode = 1; }
}
export default app;
