import { Controller, Post, Body } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ContactService } from './contact.service';
import { CreateContactDto } from './dto/create-contact.dto';
import { Public } from '../common/decorators/public.decorator';

@Public()
@Controller('contact')
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  @Throttle({ default: { limit: 5, ttl: 3600000 } })
  @Post()
  create(@Body() dto: CreateContactDto) {
    return this.contactService.create(dto);
  }
}
