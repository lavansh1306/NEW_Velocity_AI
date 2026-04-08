const { GoogleGenerativeAI } = require('@google/generative-ai');

async function testModels() {
  const apiKey = 'AIzaSyB69SEFIdaduHx0l_mi6aOo5CwfAuAuc18';
  const genAI = new GoogleGenerativeAI(apiKey);
  
  try {
    console.log('Fetching models...');
    // The listModels method is available in the SDK
    // But since I'm in a restricted environment, I'll try to just call gemma-4-31b-it handles error if not exists
    const model = genAI.getGenerativeModel({ model: 'gemma-4-31b-it' });
    const result = await model.generateContent('Hi');
    console.log('Gemma 4 31B IT is supported!');
    console.log('Response:', result.response.text());
  } catch (error) {
    console.log('Gemma 4 31B IT failed or not found.');
    console.error('Error:', error.message);
    
    // Try to list or guess other models
    try {
        console.log('Trying gemini-2.0-flash-exp (latest exp)...');
        const m2 = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
        const r2 = await m2.generateContent('Hi');
        console.log('gemini-2.0-flash-exp is supported!');
    } catch (e2) {
        console.log('gemini-2.0-flash-exp failed.');
    }
  }
}

testModels();
