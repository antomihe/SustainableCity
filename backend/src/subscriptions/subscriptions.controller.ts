// backend\src\subscriptions\subscriptions.controller.ts
import { Controller, Post, Body, Req } from '@nestjs/common'; 
import { SubscriptionsService } from './subscriptions.service';
import { SubscribeDto } from './dto/subscribe.dto';
import { Subscription } from './entities/subscription.entity';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('Subscriptions')
@Controller({ path: 'subscriptions', version: '1' })
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Public()
  @Post('subscribe')
  @ApiOperation({ summary: 'Subscribe to sustainability recommendations (Public)' })
  @ApiBody({ type: SubscribeDto })
  @ApiResponse({ status: 201, description: 'Successfully subscribed.', type: Subscription })
  @ApiResponse({ status: 409, description: 'Email already subscribed.' }) 
  @ApiResponse({ status: 422, description: 'Validation Error.' }) 
  subscribe(
    @Body() subscribeDto: SubscribeDto,
  ): Promise<Subscription> {
    return this.subscriptionsService.subscribe(subscribeDto);
  }
}