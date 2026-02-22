import { IsNumber } from 'class-validator';

export class MergeTagsDto {
  @IsNumber()
  sourceId: number;

  @IsNumber()
  targetId: number;
}
