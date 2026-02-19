---
description: How to obtain a Google Gemini API Key
---

# How to Get a Google Gemini API Key

Follow these steps to generate an API key for Google Gemini (Generative AI).

## Prerequisites
- A Google Account.

## Steps

1.  **Go to Google AI Studio**
    Navigate to [https://aistudio.google.com/](https://aistudio.google.com/).

2.  **Sign In**
    Log in with your Google account. Accept the Terms of Service if prompted.

3.  **Get API Key**
    - Click on the **"Get API key"** button (usually in the top-left sidebar).
    - Alternatively, go directly to: [https://aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey).

4.  **Create Key**
    - Click **"Create API key"**.
    - Choose one of the following:
        - **Create API key in new project**: Quickest method. Creates a new Google Cloud project automatically.
        - **Create API key in existing project**: If you already have a Google Cloud project you want to use.

5.  **Copy the Key**
    - A modal will appear with your new API key (starts with `AIza...`).
    - **Copy it immediately**. You won't be able to see it again easily.

6.  **Add to ByteForge AI**
    - Open your `.env` file in the project root.
    - Add or append the key to the `GEMINI_API_KEY` variable.
    - **For Multi-Key Rotation**: Separate multiple keys with commas.
      ```env
      GEMINI_API_KEY=AIzaSyD...,AIzaSyB...,AIzaSyC...
      ```

## Troubleshooting
- **Error 429 (Quota Exceeded)**: The free tier has limits. Generate multiple keys using different Google accounts or projects and add them all to your `.env` file to take advantage of the auto-rotation feature.
