require('dotenv').config();
const express = require('express');
const axios = require('axios');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// 글로벌 타겟 데이터 수집 모듈 (Vercel IP 차단 우회 및 GitHub 오픈 API 연동)
async function fetchMarketData(keyword) {
    try {
        const response = await axios.get(`https://api.github.com/search/repositories?q=${encodeURIComponent(keyword)}&sort=stars&order=desc`, {
            headers: { 'User-Agent': 'Validatix-Engine-Node' }
        });
        
        const items = response.data.items || [];
        let marketData = 'GitHub Open Source Competitors & Trends:\n\n';

        for (let i = 0; i < Math.min(items.length, 5); i++) {
            const item = items[i];
            marketData += `Project: ${item.name}\nDescription: ${item.description || 'No description'}\nStars: ${item.stargazers_count}\nURL: ${item.html_url}\n\n`;
        }
        
        return marketData;
    } catch (error) {
        console.error("Error fetching data:", error.message);
        return null;
    }
}

async function analyzeMarket(data) {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        const prompt = `Analyze the following market data and provide a summary of trends, potential competitors, and opportunities:\n\n${data}`;
        const result = await model.generateContent(prompt);
        return result.response.text();
    } catch (error) {
        console.error("Error analyzing data:", error);
        return "Analysis failed.";
    }
}

app.post('/api/research', async (req, res) => {
    const { idea } = req.body;
    
    if (!idea) {
        return res.status(400).json({ error: "Idea is required." });
    }

    console.log(`[Research Started] Idea: ${idea}`);
    
    const rawData = await fetchMarketData(idea);
    if (!rawData) {
        return res.status(500).json({ error: "Failed to gather market data." });
    }

    const analysisResult = await analyzeMarket(rawData);
    
    res.json({
        idea: idea,
        analysis: analysisResult
    });
});

const PORT = process.env.PORT || 3000;
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`[Validatix Research Module] running on port ${PORT}`);
    });
}
module.exports = app;