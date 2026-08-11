# Kisan Daily AI — Vercel

1. Upload this folder to a GitHub repository.
2. Import the repository in Vercel.
3. Deploy.
4. Vercel Project → Settings → Environment Variables.
5. Add `OPENAI_API_KEY` and paste your OpenAI secret key there. Do NOT put it in code.
6. Select Production (and Preview/Development if you want).
7. Save and redeploy.

The browser sends a compressed image to `/api/analyze`. The Vercel server function calls the OpenAI Responses API, so the secret key never reaches the browser.
