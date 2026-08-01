import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { SearchService, SearchResult } from './search.service';

@ApiTags('Search')
@Controller('api/v1/search')
@UseGuards(AuthGuard('jwt'))
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  @ApiOperation({ summary: 'Hybrid semantic + keyword search across user resources' })
  @ApiQuery({ name: 'q', required: true, description: 'Natural language query' })
  @ApiQuery({ name: 'cursor', required: false, description: 'Opaque pagination cursor from previous response' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Max results (default 20)' })
  @ApiQuery({ name: 'pageSize', required: false, type: Number, description: 'Max results (alias for limit)' })
  @ApiQuery({ name: 'category', required: false, description: 'Filter by AI category' })
  @ApiQuery({ name: 'tag', required: false, description: 'Filter by tag name' })
  @ApiQuery({ name: 'projectId', required: false, description: 'Filter by project id' })
  @ApiResponse({ status: 200, description: 'Ranked search results' })
  async search(
    @CurrentUser() user: { sub: string },
    @Query('q') query: string,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
    @Query('pageSize') pageSize?: string,
    @Query('category') category?: string,
    @Query('tag') tag?: string,
    @Query('projectId') projectId?: string,
  ): Promise<{
    data: SearchResult[];
    meta: { query: string; tookMs: number; mode: string; pageSize: number; nextCursor: string | null; hasMore: boolean };
  }> {
    const size = Math.min(
      100,
      Math.max(1, parseInt(pageSize ?? limit ?? '20', 10) || 20),
    );
    return this.searchService.search({
      userId: user.sub,
      query,
      limit: size,
      cursor: cursor || undefined,
      category: category || undefined,
      tag: tag || undefined,
      projectId: projectId || undefined,
    });
  }

  @Get('facets')
  @ApiOperation({ summary: 'Distinct categories and tags for search filters' })
  @ApiResponse({ status: 200, description: 'Facet lists' })
  async facets(@CurrentUser() user: { sub: string }) {
    return this.searchService.getFacets(user.sub);
  }
}
