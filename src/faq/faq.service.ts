import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FaqItem } from './entities/faq-item.entity';
import { CreateFaqItemDto } from './dto/create-faq-item.dto';
import { UpdateFaqItemDto } from './dto/update-faq-item.dto';

@Injectable()
export class FaqService {
  constructor(
    @InjectRepository(FaqItem)
    private faqRepository: Repository<FaqItem>,
  ) {}

  findAll(): Promise<FaqItem[]> {
    return this.faqRepository.find({
      where: { isActive: true },
      order: { sortOrder: 'ASC' },
    });
  }

  findAllAdmin(): Promise<FaqItem[]> {
    return this.faqRepository.find({ order: { sortOrder: 'ASC' } });
  }

  async findById(id: number): Promise<FaqItem> {
    const item = await this.faqRepository.findOne({ where: { id } });
    if (!item) throw new NotFoundException(`FAQ item #${id} not found`);
    return item;
  }

  create(dto: CreateFaqItemDto): Promise<FaqItem> {
    return this.faqRepository.save(this.faqRepository.create(dto));
  }

  async update(id: number, dto: UpdateFaqItemDto): Promise<FaqItem> {
    const item = await this.findById(id);
    Object.assign(item, dto);
    return this.faqRepository.save(item);
  }

  async remove(id: number): Promise<void> {
    const item = await this.findById(id);
    await this.faqRepository.remove(item);
  }
}
