import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CollectionsService } from './collections.service';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { createCollectionSchema, updateCollectionSchema } from '@axiom/shared';
import type { CreateCollectionDto, UpdateCollectionDto } from '@axiom/shared';

@ApiTags('Collections')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/v1/collections')
export class CollectionsController {
  constructor(private readonly collectionsService: CollectionsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new manual collection' })
  async create(
    @Body(new ZodValidationPipe(createCollectionSchema)) dto: CreateCollectionDto,
    @CurrentUser() user: { sub: string },
  ) {
    return this.collectionsService.create(dto, user.sub);
  }

  @Get()
  @ApiOperation({ summary: 'List collections by type (cursor paginated)' })
  async findAll(
    @CurrentUser() user: { sub: string },
    @Query('type') type?: string,
    @Query('cursor') cursor?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    const t = type === 'manual' ? 'manual' : 'auto';
    return this.collectionsService.findAll(
      user.sub,
      t,
      cursor,
      Math.min(100, Math.max(1, parseInt(pageSize ?? '20', 10) || 20)),
    );
  }

  @Get('options')
  @ApiOperation({ summary: 'All collections as lightweight options (dropdowns)' })
  async findOptions(@CurrentUser() user: { sub: string }) {
    return this.collectionsService.findOptions(user.sub);
  }

  @Post('sync')
  @ApiOperation({ summary: 'Materialize auto collections from AI tags' })
  async sync(@CurrentUser() user: { sub: string }) {
    return this.collectionsService.syncAutoCollections(user.sub);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a collection with its resources' })
  async findById(
    @CurrentUser() user: { sub: string },
    @Param('id') id: string,
    @Query('cursor') cursor?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.collectionsService.findById(
      id,
      user.sub,
      cursor,
      Math.min(100, Math.max(1, parseInt(pageSize ?? '50', 10) || 50)),
    );
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a collection' })
  async update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateCollectionSchema)) dto: UpdateCollectionDto,
    @CurrentUser() user: { sub: string },
  ) {
    return this.collectionsService.update(id, dto, user.sub);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a collection' })
  async remove(@Param('id') id: string, @CurrentUser() user: { sub: string }) {
    await this.collectionsService.remove(id, user.sub);
    return { message: 'Collection deleted' };
  }

  @Post(':id/resources/:resourceId')
  @ApiOperation({ summary: 'Link a resource to a collection' })
  async addResource(
    @Param('id') id: string,
    @Param('resourceId') resourceId: string,
    @CurrentUser() user: { sub: string },
  ) {
    return this.collectionsService.addResource(id, resourceId, user.sub);
  }

  @Delete(':id/resources/:resourceId')
  @ApiOperation({ summary: 'Unlink a resource from a collection' })
  async removeResource(
    @Param('id') id: string,
    @Param('resourceId') resourceId: string,
    @CurrentUser() user: { sub: string },
  ) {
    await this.collectionsService.removeResource(id, resourceId, user.sub);
    return { message: 'Resource removed from collection' };
  }
}
