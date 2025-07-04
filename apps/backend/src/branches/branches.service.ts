import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
// Define our own types to avoid dependency on Prisma generated types
type Branch = any; // Represents a branch entity

// Define our own input types to match Prisma's expected structure
interface BranchCreateInput {
  name: string;
  address?: string;
  phone?: string;
  [key: string]: any; // Allow any other fields
}

interface BranchWhereInput {
  id?: string;
  name?: string | { contains?: string };
  [key: string]: any; // Allow any other fields
}

interface BranchOrderByWithRelationInput {
  id?: 'asc' | 'desc';
  name?: 'asc' | 'desc';
  [key: string]: any; // Allow any other fields
}

interface BranchUpdateInput {
  name?: string;
  address?: string;
  phone?: string;
  [key: string]: any; // Allow any other fields
}

@Injectable()
export class BranchesService {
  constructor(private prisma: PrismaService) {}

  async create(data: BranchCreateInput): Promise<Branch> {
    return this.prisma.branch.create({
      data,
    });
  }

  async findAll(params: {
    skip?: number;
    take?: number;
    where?: BranchWhereInput;
    orderBy?: BranchOrderByWithRelationInput;
  }): Promise<Branch[]> {
    const { skip, take, where, orderBy } = params;
    return this.prisma.branch.findMany({
      skip,
      take,
      where,
      orderBy,
      include: {
        _count: {
          select: {
            services: true,
            users: true, // staff yerine users kullanıldı (prisma şemasında users olarak tanımlanmış olmalı)
          },
        },
      },
    });
  }

  async findOne(id: string): Promise<Branch> {
    const branch = await this.prisma.branch.findUnique({
      where: { id },
      include: {
        services: true,
        users: true, // staff yerine users kullanıldı (prisma şemasında users olarak tanımlanmış olmalı)
      },
    });

    if (!branch) {
      throw new NotFoundException(`Şube ID:${id} bulunamadı`);
    }

    return branch;
  }

  async update(id: string, data: BranchUpdateInput): Promise<Branch> {
    try {
      return await this.prisma.branch.update({
        where: { id },
        data,
      });
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`Şube ID:${id} bulunamadı`);
      }
      throw error;
    }
  }

  async remove(id: string): Promise<Branch> {
    try {
      return await this.prisma.branch.delete({
        where: { id },
      });
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`Şube ID:${id} bulunamadı`);
      }
      throw error;
    }
  }
}



