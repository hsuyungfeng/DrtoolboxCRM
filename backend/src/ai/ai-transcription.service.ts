import { Injectable, Logger } from '@nestjs/common';
import { PROMPT_TEMPLATES, DEFAULT_PROMPT_CONFIG, PromptTemplate } from './prompt-templates';

export interface TranscriptionRequest {
  text: string;
  patientId?: string;
  sessionId?: string;
  clinicId: string;
  templateType?: 'progress' | 'consultation' | 'treatment' | 'followup' | 'discharge' | 'referral';
}

export interface TranscriptionResult {
  originalText: string;
  structuredNote: string;
  summary: string;
  keyPoints: string[];
  tags: string[];
  suggestedActions?: string[];
  templateUsed?: string;
  processingTime?: number;
}

export interface OllamaConfig {
  url: string;
  model: string;
  maxTokens: number;
  temperature: number;
  topP: number;
}

@Injectable()
export class AiTranscriptionService {
  private readonly logger = new Logger(AiTranscriptionService.name);
  private readonly config: OllamaConfig;

  constructor() {
    this.config = {
      url: process.env.OLLAMA_URL || 'http://localhost:11434',
      model: process.env.OLLAMA_MODEL || 'llama3.2',
      maxTokens: parseInt(process.env.OLLAMA_MAX_TOKENS || '2000', 10),
      temperature: parseFloat(process.env.OLLAMA_TEMPERATURE || '0.3'),
      topP: parseFloat(process.env.OLLAMA_TOP_P || '0.9'),
    };
  }

  async transcribeMedicalNote(request: TranscriptionRequest): Promise<TranscriptionResult> {
    const startTime = Date.now();
    const { text, templateType = 'progress' } = request;

    try {
      const template = PROMPT_TEMPLATES[templateType] || PROMPT_TEMPLATES.progress;
      const prompt = this.buildPromptFromTemplate(template, text);
      const structuredNote = await this.callOllama(prompt);
      const parsed = this.parseResponse(structuredNote, text);

      this.logger.log(`Transcription completed for patient: ${request.patientId}, template: ${templateType}`);
      
      return {
        ...parsed,
        templateUsed: templateType,
        processingTime: Date.now() - startTime,
      };
    } catch (error) {
      this.logger.error(`Transcription failed: ${error.message}`);
      return {
        ...this.getFallbackResult(text),
        templateUsed: templateType,
        processingTime: Date.now() - startTime,
      };
    }
  }

  async batchTranscribe(requests: TranscriptionRequest[]): Promise<TranscriptionResult[]> {
    const results = await Promise.all(
      requests.map(async (req) => this.transcribeMedicalNote(req))
    );
    return results;
  }

  async analyzeTreatmentEffectiveness(
    sessions: Array<{
      date: string;
      notes: string;
      patientFeedback?: string;
    }>
  ): Promise<{
    effectiveness: string;
    trends: string[];
    recommendations: string[];
  }> {
    const sessionsText = sessions
      .map((s, i) => `${i + 1}. [${s.date}] ${s.notes}${s.patientFeedback ? ` | 患者反饋: ${s.patientFeedback}` : ''}`)
      .join('\n');

    const prompt = `你是一位專業的醫療數據分析師。請分析以下療程會話記錄，評估治療效果。

療程記錄：
${sessionsText}

請以 JSON 格式輸出：
{
  "effectiveness": "治療效果總結（有效/待觀察/無效）",
  "trends": ["趨勢1", "趨勢2", "趨勢3"],
  "recommendations": ["建議1", "建議2", "建議3"]
}`;

    try {
      const response = await this.callOllama(prompt);
      const parsed = JSON.parse(response.match(/\{[\s\S]*\}/)?.[0] || '{}');
      return {
        effectiveness: parsed.effectiveness || '待觀察',
        trends: parsed.trends || [],
        recommendations: parsed.recommendations || [],
      };
    } catch (error) {
      this.logger.error(`Analysis failed: ${error.message}`);
      return {
        effectiveness: '待觀察',
        trends: ['無法分析'],
        recommendations: ['請檢查數據'],
      };
    }
  }

  async generateTreatmentPlan(
    diagnosis: string,
    patientHistory: string,
    constraints?: string
  ): Promise<{
    plan: string;
    sessions: number;
    estimatedWeeks: number;
    precautions: string[];
  }> {
    const prompt = `你是一位專業的醫療顧問。請根據以下資訊建議治療計畫。

診斷：${diagnosis}
患者歷史：${patientHistory}
限制條件：${constraints || '無'}

請以 JSON 格式輸出：
{
  "plan": "治療計畫建議（具體描述）",
  "sessions": 建議療程次數（數字）,
  "estimatedWeeks": 預估週數（數字）,
  "precautions": ["注意事項1", "注意事項2", "注意事項3"]
}`;

    try {
      const response = await this.callOllama(prompt);
      const parsed = JSON.parse(response.match(/\{[\s\S]*\}/)?.[0] || '{}');
      return {
        plan: parsed.plan || '無法生成計畫',
        sessions: parsed.sessions || 0,
        estimatedWeeks: parsed.estimatedWeeks || 0,
        precautions: parsed.precautions || [],
      };
    } catch (error) {
      this.logger.error(`Plan generation failed: ${error.message}`);
      return {
        plan: '請稍後再試',
        sessions: 0,
        estimatedWeeks: 0,
        precautions: ['系統錯誤'],
      };
    }
  }

  private buildPromptFromTemplate(template: PromptTemplate, text: string): string {
    return `<system>
${template.systemPrompt}
</system>

<user>
請將以下臨床記錄轉換為結構化格式：

原始記錄：
${text}

請以 JSON 格式輸出，確保包含以下欄位：
- structuredNote: 結構化筆記
- summary: 簡短摘要
- keyPoints: 關鍵點陣列
- tags: 相關標籤陣列
- suggestedActions: 建議行動陣列（可選）
</user>`;
  }

  private async callOllama(prompt: string): Promise<string> {
    try {
      const response = await fetch(`${this.config.url}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.config.model,
          prompt,
          stream: false,
          format: 'json',
          options: {
            temperature: this.config.temperature,
            top_p: this.config.topP,
            num_predict: this.config.maxTokens,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.status}`);
      }

      const data = await response.json();
      return data.response || '';
    } catch (error) {
      this.logger.warn(`Ollama not available: ${error.message}`);
      throw error;
    }
  }

  private parseResponse(response: string, originalText: string): TranscriptionResult {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          originalText,
          structuredNote: parsed.structuredNote || response,
          summary: parsed.summary || '',
          keyPoints: parsed.keyPoints || [],
          tags: parsed.tags || [],
          suggestedActions: parsed.suggestedActions || [],
        };
      }
    } catch (error) {
      this.logger.warn(`Failed to parse LLM response: ${error.message}`);
    }

    return this.getFallbackResult(originalText);
  }

  private getFallbackResult(text: string): TranscriptionResult {
    const words = text.split(/\s+/);
    const summary = words.slice(0, 20).join(' ') + (words.length > 20 ? '...' : '');

    return {
      originalText: text,
      structuredNote: `## 臨床筆記\n\n${text}\n\n---\n*此為自動生成的筆記，建議人工覆核*`,
      summary,
      keyPoints: [text.substring(0, 100)],
      tags: ['待審核', 'AI生成'],
    };
  }

  async checkHealth(): Promise<{ 
    status: string; 
    model: string; 
    config: OllamaConfig;
    available: boolean;
  }> {
    try {
      const response = await fetch(`${this.config.url}/api/tags`);
      if (response.ok) {
        return { 
          status: 'online', 
          model: this.config.model,
          config: this.config,
          available: true,
        };
      }
    } catch (error) {
      this.logger.warn(`Ollama health check failed: ${error.message}`);
    }
    return { 
      status: 'offline', 
      model: this.config.model,
      config: this.config,
      available: false,
    };
  }

  getAvailableTemplates(): Array<{ type: string; name: string; description: string }> {
    return Object.entries(PROMPT_TEMPLATES).map(([type, template]) => ({
      type,
      name: template.name,
      description: template.description,
    }));
  }
}
