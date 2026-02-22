import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ContactSubmission } from './entities/contact-submission.entity';
import { CreateContactDto } from './dto/create-contact.dto';

@Injectable()
export class ContactService {
  constructor(
    @InjectRepository(ContactSubmission)
    private contactRepository: Repository<ContactSubmission>,
  ) {}

  create(dto: CreateContactDto): Promise<ContactSubmission> {
    const submission = this.contactRepository.create(dto);
    return this.contactRepository.save(submission);
  }

  findAll(page: number = 1, limit: number = 20, isRead?: boolean): Promise<[ContactSubmission[], number]> {
    const where: any = {};
    if (isRead !== undefined) where.isRead = isRead;
    return this.contactRepository.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
  }

  async findById(id: number): Promise<ContactSubmission> {
    const c = await this.contactRepository.findOne({ where: { id } });
    if (!c) throw new NotFoundException(`Contact submission #${id} not found`);
    return c;
  }

  async update(id: number, data: Partial<ContactSubmission>): Promise<ContactSubmission> {
    const c = await this.findById(id);
    Object.assign(c, data);
    return this.contactRepository.save(c);
  }
}
