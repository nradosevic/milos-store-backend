import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ContactSubmission } from './entities/contact-submission.entity';
import { ContactService } from './contact.service';
import { ContactController } from './contact.controller';
import { AdminContactController } from './admin-contact.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ContactSubmission])],
  controllers: [ContactController, AdminContactController],
  providers: [ContactService],
  exports: [ContactService],
})
export class ContactModule {}
