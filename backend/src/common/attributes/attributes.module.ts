import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AttributeDefinition } from './entities/attribute-definition.entity';
import { AttributeService } from './services/attribute.service';
import { AttributeController } from './controllers/attribute.controller';

@Module({
  imports: [TypeOrmModule.forFeature([AttributeDefinition])],
  controllers: [AttributeController],
  providers: [AttributeService],
  exports: [AttributeService],
})
export class AttributesModule {}
