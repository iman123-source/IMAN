
import { GoogleGenAI, Type } from "@google/genai";
import { Job, AIAnalysis } from "../types";

export async function analyzeJobsWithAI(jobs: Job[]): Promise<AIAnalysis> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const jobsData = jobs.map(j => {
    // Corrected financial calculation for AI context
    const mCost = (j.materialPayments && j.materialPayments.length > 0) 
      ? j.materialPayments.reduce((s, p) => s + p.amount, 0) 
      : (j.material || 0);
    const lCost = (j.labourEntries && j.labourEntries.length > 0) 
      ? j.labourEntries.reduce((s, e) => s + e.amount, 0) 
      : (j.labour || 0);
    const profit = (j.total || 0) - mCost - lCost;
    const margin = j.total > 0 ? (profit / j.total) * 100 : 0;
    
    return {
      name: j.name,
      total: j.total,
      material: mCost,
      labour: lCost,
      profit,
      margin: margin.toFixed(1) + '%'
    };
  });

  const prompt = `Analyze the following construction job portfolio and provide a business report. 
  Identify which jobs are high risk (low margin) and which are performing well. 
  Provide specific recommendations for cost-saving or operational improvements.
  
  Portfolio Data:
  ${JSON.stringify(jobsData, null, 2)}`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING, description: "A high-level summary of portfolio health." },
            riskAssessment: { type: Type.STRING, description: "Detailed assessment of risks found in the data." },
            recommendations: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING },
              description: "Actionable steps to improve margins."
            },
          },
          required: ["summary", "riskAssessment", "recommendations"]
        }
      }
    });

    return JSON.parse(response.text.trim());
  } catch (error) {
    console.error("AI Analysis failed", error);
    throw error;
  }
}
