<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1R5UDxfikCjB16E0HcUqhfewKEsbdyRI1

## Run Locally

**Prerequisites:**  Node.js (v20.9.0 or higher)

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure your API key:**
   - Get your API key from [Google AI Studio](https://aistudio.google.com/apikey)
   - Open `.env.local` and replace `your_gemini_api_key_here` with your actual API key
   - Note: For Veo video generation, you'll need a paid API key with Vertex AI access

3. **Run the development server:**
   ```bash
   npm run dev
   ```

4. **Open your browser:**
   - Navigate to [http://localhost:5173](http://localhost:5173)

## Features

- **Brainstorm**: Discover trending niches using Google Search Grounding
- **Tech Stack**: Choose between Veo video generation or Imagen images
- **Content Generation**: Generate scripts, visuals, and voiceovers automatically

## API Requirements

This app uses the following Google AI models:
- Gemini 2.5 Flash (script generation & reasoning)
- Veo 3.1 (video generation - requires paid tier)
- Imagen 3.0 (image generation)
- Gemini TTS (text-to-speech)
