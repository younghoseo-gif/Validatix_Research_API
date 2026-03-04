require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// 글로벌 타겟 웹 크롤러 (API 키 불필요)
async function fetchMarketData(keyword) {
    try {
        const response = await axios.get(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(keyword)}`, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
        });
        const $ = cheerio.load(response.data);
        let marketData = '';

        $('.result').each((i, el) => {
            if(i >= 5) return false;
            const title = $(el).find('.result__title').text().trim();
            const snippet = $(el).find('.result__snippet').text().trim();
            const link = $(el).find('.result__url').attr('href');
            if(title) {
                marketData += `Title: ${title}\nSnippet: ${snippet}\nLink: ${link}\n\n`;
            }
        });
        return marketData;
    } catch (error) {
        console.error("Error fetching data:", error);
        return null;
    }
}

async function analyzeMarket(data) {
    try {
        // [패치됨] 검증된 최신 모델인 gemini-2.5-flash 적용
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