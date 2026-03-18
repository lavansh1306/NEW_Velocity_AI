/**
 * Optional LLM Integration for AI-powered insight summaries
 * Supports Google Gemini, OpenAI, and other LLM providers
 */

export interface LLMConfig {
  provider: 'gemini' | 'openai' | 'none';
  apiKey?: string;
  model?: string;
}

export interface InsightSummary {
  executive_summary: string;
  key_findings: string[];
  action_items: string[];
  confidence_score: number;
}

/**
 * Format project insights as structured text for LLM analysis
 */
export function formatInsightsForLLM(insights: any): string {
  return `
PROJECT STATUS ANALYSIS

Overall Status: ${insights.riskLevel}
Completion: ${insights.summary.completionPercentage}% (${insights.summary.completedTasks}/${insights.summary.totalTasks} tasks)

KEY METRICS:
- Overdue Tasks: ${insights.summary.overdueTasks}
- At-Risk Tasks: ${insights.summary.atRiskTasks}
- Overloaded Team Members: ${insights.summary.overloadedMembers}

IDENTIFIED RISKS:
${insights.risks.map((r: any) => `- [${r.level.toUpperCase()}] ${r.title}: ${r.description}`).join('\n')}

RECOMMENDED ACTIONS:
${insights.recommendations.map((r: any, i: number) => `${i + 1}. ${r}`).join('\n')}

Please provide a brief executive summary and confidence assessment of this project status.
  `;
}

/**
 * Call Gemini API for insight summarization
 */
export async function callGemini(
  insights: any,
  apiKey: string,
  model: string = 'gemini-pro'
): Promise<InsightSummary | null> {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: formatInsightsForLLM(insights) + '\n\nRespond in JSON format with: { executive_summary, key_findings (array), action_items (array), confidence_score (0-1) }'
                }
              ]
            }
          ]
        })
      }
    );

    if (!response.ok) {
      console.error('Gemini API error:', response.statusText);
      return null;
    }

    const data = await response.json();
    const textContent = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!textContent) return null;

    // Parse JSON response
    const jsonMatch = textContent.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    return null;
  } catch (error) {
    console.error('Error calling Gemini API:', error);
    return null;
  }
}

/**
 * Call OpenAI API for insight summarization
 */
export async function callOpenAI(
  insights: any,
  apiKey: string,
  model: string = 'gpt-3.5-turbo'
): Promise<InsightSummary | null> {
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'system',
            content: 'You are a project management AI assistant. Analyze project insights and provide concise, actionable summaries in JSON format.'
          },
          {
            role: 'user',
            content: formatInsightsForLLM(insights) + '\n\nRespond in JSON format with: { "executive_summary": string, "key_findings": string[], "action_items": string[], "confidence_score": number (0-1) }'
          }
        ],
        temperature: 0.7
      })
    });

    if (!response.ok) {
      console.error('OpenAI API error:', response.statusText);
      return null;
    }

    const data = await response.json();
    const textContent = data.choices?.[0]?.message?.content;

    if (!textContent) return null;

    // Parse JSON response
    const jsonMatch = textContent.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    return null;
  } catch (error) {
    console.error('Error calling OpenAI API:', error);
    return null;
  }
}

/**
 * Get LLM summary with fallback to local analysis
 */
export async function getLLMSummary(
  insights: any,
  config: LLMConfig
): Promise<InsightSummary | null> {
  if (!config.apiKey || config.provider === 'none') {
    return null;
  }

  try {
    if (config.provider === 'gemini') {
      return await callGemini(insights, config.apiKey, config.model);
    } else if (config.provider === 'openai') {
      return await callOpenAI(insights, config.apiKey, config.model);
    }
  } catch (error) {
    console.error('LLM summary error:', error);
  }

  return null;
}

/**
 * Generate local (non-LLM) summary from insights
 */
export function generateLocalSummary(insights: any): InsightSummary {
  const summary = `${insights.riskLevel === 'critical' ? '🚨 Critical Issues: ' : insights.riskLevel === 'warning' ? '⚠️ Attention Needed: ' : '✅ On Track: '}${insights.riskLevel === 'healthy' ? 'Project is progressing well with no major blockers.' : `${insights.risks.length} issue${insights.risks.length > 1 ? 's' : ''} require attention.`}`;

  return {
    executive_summary: summary,
    key_findings: [
      `${insights.summary.completionPercentage}% of tasks completed`,
      ...(insights.summary.overdueTasks > 0 ? [`${insights.summary.overdueTasks} overdue task${insights.summary.overdueTasks > 1 ? 's' : ''}`] : []),
      ...(insights.summary.atRiskTasks > 0 ? [`${insights.summary.atRiskTasks} task${insights.summary.atRiskTasks > 1 ? 's' : ''} at risk`] : []),
      ...(insights.summary.overloadedMembers > 0 ? [`${insights.summary.overloadedMembers} team member${insights.summary.overloadedMembers > 1 ? 's' : ''} overloaded`] : [])
    ].filter(Boolean),
    action_items: insights.recommendations.slice(0, 5),
    confidence_score: 0.9
  };
}
