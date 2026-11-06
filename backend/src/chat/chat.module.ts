import { Module } from '@nestjs/common';
import { ChatController } from 'src/chat/controllers/chat.controller';
import { ChatService } from 'src/chat/services/chat.service';

@Module({
  controllers: [ChatController],
  providers: [ChatService],
  exports: [ChatService],
})
export class ChatModule {}
