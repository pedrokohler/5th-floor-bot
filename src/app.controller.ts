import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  healthCheck(): any {
    return {
      healthy: true,
    };
  }

  @Get('opportunities')
  getOpportunities(): any {
    return this.appService.checkNewOpportunities();
  }
}
