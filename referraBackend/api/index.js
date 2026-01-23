import app from "../app.js";

// Export as Vercel serverless function handler with error handling
//Vercel Serverless Function Entry Point
export default async (req, res) => {
  try {
    return app(req, res);
  } catch (error) {
    console.error("Serverless function error:", error);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: "Internal Server Error",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }
};
