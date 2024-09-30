import { IsNotEmpty, IsString } from 'class-validator';

export class ParseVkGroupHistoryDto {
  @IsNotEmpty({ message: 'Group id should not be empty' })
  @IsString({ message: 'Please provide valid group Id' })
  group_id: string;
}
