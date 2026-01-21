import app from '../app.js';

// Export as Vercel serverless function handler
export default (req, res) => {
  return app(req, res);
};
