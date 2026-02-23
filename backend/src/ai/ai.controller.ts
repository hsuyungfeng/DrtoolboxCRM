import { Controller, Post, Body, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AiTranscriptionService } from './ai-transcription.service';
import type { TranscriptionRequest, TranscriptionResult } from './ai-transcription.service';

@ApiTags('ai')
@Controller('ai')
export class AiController {
  constructor(private readonly aiTranscriptionService: AiTranscriptionService) {}

  @Post('transcribe')
  @ApiOperation({ summary: '將醫療筆記轉錄為結構化格式' })
  @ApiResponse({ status: 200, description: '轉錄成功' })
  @ApiResponse({ status: 500, description: '轉錄失敗' })
  async transcribe(
    @Body() request: TranscriptionRequest,
  ): Promise<TranscriptionResult> {
    return this.aiTranscriptionService.transcribeMedicalNote(request);
  }

  @Post('transcribe/batch')
  @ApiOperation({ summary: '批量轉錄多筆記' })
  @ApiResponse({ status: 200, description: '批量轉錄成功' })
  async batchTranscribe(
    @Body() body: { requests: TranscriptionRequest[] },
  ): Promise<TranscriptionResult[]> {
    return this.aiTranscriptionService.batchTranscribe(body.requests);
  }

  @Get('templates')
  @ApiOperation({ summary: '取得可用的筆記模板' })
  @ApiResponse({ status: 200, description: '模板列表' })
  getTemplates() {
    return this.aiTranscriptionService.getAvailableTemplates();
  }

  @Post('analyze-effectiveness')
  @ApiOperation({ summary: '分析治療效果' })
  @ApiResponse({ status: 200, description: '分析成功' })
  async analyzeEffectiveness(
    @Body() body: {
      sessions: Array<{ date: string; notes: string; patientFeedback?: string }>;
    },
  ) {
    return this.aiTranscriptionService.analyzeTreatmentEffectiveness(body.sessions);
  }

  @Post('generate-plan')
  @ApiOperation({ summary: '生成治療計畫建議' })
  @ApiResponse({ status: 200, description: '生成成功' })
  async generatePlan(
    @Body() body: {
      diagnosis: string;
      patientHistory: string;
      constraints?: string;
    },
  ) {
    return this.aiTranscriptionService.generateTreatmentPlan(
      body.diagnosis,
      body.patientHistory,
      body.constraints,
    );
  }

  @Get('health')
  @ApiOperation({ summary: '檢查 AI 服務狀態' })
  async checkHealth() {
    return this.aiTranscriptionService.checkHealth();
  }

  @Post('analyze-notes')
  @ApiOperation({ summary: '分析現有筆記並提供建議' })
  async analyzeNotes(
    @Body() body: { notes: string[]; clinicId: string },
  ) {
    const analyses = await Promise.all(
      body.notes.map(async (note) => {
        const result = await this.aiTranscriptionService.transcribeMedicalNote({
          text: note,
          clinicId: body.clinicId,
          templateType: 'progress',
        });
        return result;
      }),
    );

    return {
      totalNotes: body.notes.length,
      analyses,
      summary: {
        totalKeyPoints: analyses.reduce((sum, a) => sum + a.keyPoints.length, 0),
        commonTags: this.getCommonTags(analyses),
      },
    };
  }

  private getCommonTags(analyses: TranscriptionResult[]): string[] {
    const tagCounts = new Map<string, number>();
    analyses.forEach((a) => {
      a.tags.forEach((tag) => {
        tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
      });
    });
    return Array.from(tagCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([tag]) => tag);
  }
}
