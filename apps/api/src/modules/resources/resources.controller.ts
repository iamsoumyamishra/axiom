import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ResourcesService } from './resources.service';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { saveResourceSchema, resourceQuerySchema, updateResourceSchema, mergeResourceSchema } from '@axiom/shared';
import type { SaveResourceDto, ResourceQueryDto, UpdateResourceDto, MergeResourceDto } from '@axiom/shared';

@ApiTags('Resources')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/v1/resources')
export class ResourcesController {
  constructor(private readonly resourcesService: ResourcesService) {}

  @Post()
  @ApiOperation({ summary: 'Save a new resource' })
  async create(
    @Body(new ZodValidationPipe(saveResourceSchema)) dto: SaveResourceDto,
    @CurrentUser() user: { sub: string },
  ) {
    return this.resourcesService.create(dto, user.sub);
  }

  @Get()
  @ApiOperation({ summary: 'List resources with pagination and filters' })
  async findAll(
    @Query(new ZodValidationPipe(resourceQuerySchema)) query: ResourceQueryDto,
    @CurrentUser() user: { sub: string },
  ) {
    return this.resourcesService.findAll(query, user.sub);
  }

  @Get('suggestions')
  @ApiOperation({ summary: 'List merge suggestions with cursor pagination' })
  async findSuggestions(
    @Query(new ZodValidationPipe(resourceQuerySchema)) query: ResourceQueryDto,
    @CurrentUser() user: { sub: string },
  ) {
    return this.resourcesService.findSuggestions(query, user.sub);
  }

  @Post('merge')
  @ApiOperation({ summary: 'Merge a duplicate resource into a canonical one' })
  async merge(
    @Body(new ZodValidationPipe(mergeResourceSchema)) dto: MergeResourceDto,
    @CurrentUser() user: { sub: string },
  ) {
    return this.resourcesService.merge(dto.duplicateId, dto.canonicalId, user.sub);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a resource by ID' })
  async findById(
    @Param('id') id: string,
    @CurrentUser() user: { sub: string },
  ) {
    return this.resourcesService.findById(id, user.sub);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a resource' })
  async update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateResourceSchema)) dto: UpdateResourceDto,
    @CurrentUser() user: { sub: string },
  ) {
    return this.resourcesService.update(id, dto, user.sub);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a resource' })
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: { sub: string },
  ) {
    await this.resourcesService.remove(id, user.sub);
    return { message: 'Resource deleted' };
  }
}
