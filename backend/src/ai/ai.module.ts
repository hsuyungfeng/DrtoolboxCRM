import { Module } from '@nestjs/common';
import { AiTranscriptionService } from './ai-transcription.service';
import { AiController } from './ai.controller';

@Module({
  providers: [AiTranscriptionService],
  controllers: [AiController],
  exports: [AiTranscriptionService],
})
export class AiModule {}
