import { Controller, Get, Delete, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RelationshipsService } from './relationships.service';

@ApiTags('Relationships')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/v1')
export class RelationshipsController {
  constructor(private readonly relationshipsService: RelationshipsService) {}

  @Get('resources/:id/related')
  @ApiOperation({ summary: 'List related resources' })
  async findRelated(
    @Param('id') id: string,
    @CurrentUser() user: { sub: string },
    @Query('limit') limit?: string,
    @Query('type') type?: string,
  ) {
    const resolvedLimit = Math.min(50, Math.max(1, parseInt(limit ?? '10', 10) || 10));
    return this.relationshipsService.findRelated(id, user.sub, resolvedLimit, type || undefined);
  }

  @Delete('relationships/:id')
  @ApiOperation({ summary: 'Remove a relationship' })
  async remove(@Param('id') id: string, @CurrentUser() user: { sub: string }) {
    return this.relationshipsService.remove(id, user.sub);
  }
}
