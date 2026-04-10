import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;

async function listModels() {
  console.log('Fetching available Gemini models...');
  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${GEMINI_API_KEY}`;
  
  try {
    const response = await fetch(url);
    const data = await response.json() as any;
    
    if (data.error) {
      console.error('API Error:', data.error);
      return;
    }
    
    console.log('Available Models:');
    data.models?.forEach((m: any) => {
      if (m.supportedGenerationMethods.includes('embedContent')) {
        console.log(`- ${m.name} (Supports Embedding)`);
      } else {
        console.log(`- ${m.name}`);
      }
    });
  } catch (err) {
    console.error('Fetch Error:', err);
  }
}

listModels();
