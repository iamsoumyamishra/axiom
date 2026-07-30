import { Controller, Get, Query, UseGuards, Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SearchService, SearchResult } from './search.service';

@ApiTags('Search')
@Controller('api/v1/search')
@UseGuards(AuthGuard('jwt'))
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  @ApiOperation({ summary: 'Semantic search across user resources' })
  @ApiQuery({ name: 'q', required: true, description: 'Natural language query' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Max results (default 20)' })
  @ApiResponse({ status: 200, description: 'Ranked search results' })
  async search(
    @Req() req: { user: { userId: string } },
    @Query('q') query: string,
    @Query('limit') limit?: string,
  ): Promise<{ data: SearchResult[]; meta: { query: string; tookMs: number } }> {
    const results = await this.searchService.search({
      userId: req.user.userId,
      query,
      limit: Math.min(parseInt(limit ?? '20', 10) || 20, 100),
    });

    return results;
  }
}
