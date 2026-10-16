# Backend status

This project currently has **no backend code, API endpoints, database, or server process**. TideCatcher is a static browser game; its gameplay and saved progress run in the frontend/browser.

The `backend/` directory is reserved to make the project boundary explicit. Do not add a placeholder server just to populate it. If a future requirement needs server-side behavior, choose an actual runtime/API design first; for Vercel-native endpoints, evaluate its serverless `api/` convention and deployment settings rather than assuming this folder is automatically executed.
