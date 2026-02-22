import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FaqItem } from './entities/faq-item.entity';
import { FaqService } from './faq.service';
import { FaqController } from './faq.controller';
import { AdminFaqController } from './admin-faq.controller';

@Module({
  imports: [TypeOrmModule.forFeature([FaqItem])],
  controllers: [FaqController, AdminFaqController],
  providers: [FaqService],
  exports: [FaqService],
})
export class FaqModule {}
