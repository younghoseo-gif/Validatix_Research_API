require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
app.use(cors()); 
app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function analyzeMarketWithAI(idea) {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        
        // [수정됨] 언어 자동 감지 및 동기화 프롬프트 엔지니어링 주입
        const prompt = `You are "The Architect", a world-class business strategist and market analyst.
Your objective is to provide a brutal, objective, and highly detailed market validation report for the following software/app idea.

[Language Requirement: CRITICAL]
Identify the primary language used in the [User's Idea]. You MUST write the ENTIRE analysis report (including all headings, bullet points, and paragraphs) in that EXACT SAME LANGUAGE. If the idea is written in Korean, output exclusively in professional Korean. If in English, output exclusively in professional English. Do not mix languages.

[User's Idea]
"${idea}"

[Required Output Structure (Translate these headings into the detected language)]
## Phase 1: Market Research & Feasibility Validation

### 1. Market Trends & Target Audience
- (Objective trend analysis encompassing global and local markets)
- (Precise persona and target audience definition)

### 2. Competitor Analysis
- (List at least 3 actual companies or platforms offering similar services globally/locally, and analyze their weaknesses)

### 3. Technical Feasibility & Opportunities
- (Propose core tech stack required for implementation)
- (Differentiation points to dominate competitors and market entry strategy)

Maintain a cold, objective, and strictly analytical tone. Do not use filler words. Base your analysis on real-world data and logic.`;

        const result = await model.generateContent(prompt);
        return result.response.text();
    } catch (error) {
        console.error("Error analyzing data:", error);
        return "Analysis failed due to AI Engine Error.";
    }
}

app.post('/api/research', async (req, res) => {
    const { idea } = req.body;
    
    if (!idea) {
        return res.status(400).json({ error: "Idea is required." });
    }

    console.log(`[Research Started] Idea: ${idea}`);
    
    const analysisResult = await analyzeMarketWithAI(idea);
    
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