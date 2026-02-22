import {
  Controller, Get, Patch, Param, ParseIntPipe, Query, Body,
} from '@nestjs/common';
import { ContactService } from './contact.service';

@Controller('admin/contacts')
export class AdminContactController {
  constructor(private readonly contactService: ContactService) {}

  @Get()
  async findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
    @Query('isRead') isRead?: string,
  ) {
    const isReadBool = isRead === 'true' ? true : isRead === 'false' ? false : undefined;
    const [data, total] = await this.contactService.findAll(page, limit, isReadBool);
    return { data, total, page, limit };
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { isRead?: boolean },
  ) {
    return this.contactService.update(id, body);
  }
}
