import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ProjectsService } from './projects.service';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { createProjectSchema, updateProjectSchema } from '@axiom/shared';
import type { CreateProjectDto, UpdateProjectDto } from '@axiom/shared';

@ApiTags('Projects')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/v1/projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new project' })
  async create(
    @Body(new ZodValidationPipe(createProjectSchema)) dto: CreateProjectDto,
    @CurrentUser() user: { sub: string },
  ) {
    return this.projectsService.create(dto, user.sub);
  }

  @Get()
  @ApiOperation({ summary: 'List all projects' })
  async findAll(@CurrentUser() user: { sub: string }) {
    return this.projectsService.findAll(user.sub);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a project with its resources' })
  async findById(
    @CurrentUser() user: { sub: string },
    @Param('id') id: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.projectsService.findById(
      id,
      user.sub,
      Math.max(1, parseInt(page ?? '1', 10) || 1),
      Math.min(100, Math.max(1, parseInt(pageSize ?? '50', 10) || 50)),
    );
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a project' })
  async update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateProjectSchema)) dto: UpdateProjectDto,
    @CurrentUser() user: { sub: string },
  ) {
    return this.projectsService.update(id, dto, user.sub);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a project' })
  async remove(@Param('id') id: string, @CurrentUser() user: { sub: string }) {
    await this.projectsService.remove(id, user.sub);
    return { message: 'Project deleted' };
  }

  @Post(':id/resources/:resourceId')
  @ApiOperation({ summary: 'Link a resource to a project' })
  async addResource(
    @Param('id') id: string,
    @Param('resourceId') resourceId: string,
    @CurrentUser() user: { sub: string },
  ) {
    return this.projectsService.addResource(id, resourceId, user.sub);
  }

  @Delete(':id/resources/:resourceId')
  @ApiOperation({ summary: 'Unlink a resource from a project' })
  async removeResource(
    @Param('id') id: string,
    @Param('resourceId') resourceId: string,
    @CurrentUser() user: { sub: string },
  ) {
    await this.projectsService.removeResource(id, resourceId, user.sub);
    return { message: 'Resource removed from project' };
  }
}
