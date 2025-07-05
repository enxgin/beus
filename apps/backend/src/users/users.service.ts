import { Injectable, ConflictException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserRole } from '../prisma/prisma-types';
import * as bcrypt from 'bcrypt';
import { Prisma } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto, currentUser: any) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      throw new ConflictException('Bu e-posta adresi zaten kullanılıyor');
    }

    if (currentUser.role === UserRole.BRANCH_MANAGER) {
      createUserDto.branchId = currentUser.branchId;
    } else if (!createUserDto.branchId && (currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.SUPER_BRANCH_MANAGER)) {
      throw new ConflictException('Şube IDsi gereklidir.');
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    const { email, name, role, branchId } = createUserDto;

    const data: Prisma.UserCreateInput = {
      name,
      email,
      password: hashedPassword,
      role,
      ...(branchId && { branch: { connect: { id: branchId } } }),
    };

    const user = await this.prisma.user.create({
      data,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        branchId: true,
      },
    });

    return user;
  }

  async findAll(currentUser: any) {
    const where: Prisma.UserWhereInput = {};

    if (currentUser.role === UserRole.SUPER_BRANCH_MANAGER) {
      where.branchId = { in: currentUser.branchIds };
    } else if (
      currentUser.role === UserRole.BRANCH_MANAGER ||
      currentUser.role === UserRole.RECEPTION ||
      currentUser.role === UserRole.STAFF
    ) {
      where.branchId = currentUser.branchId;
    }

    const users = await this.prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        branchId: true,
        branch: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const total = await this.prisma.user.count({ where });

    return {
      data: users,
      meta: {
        total,
      },
    };
  }

  async findOne(id: string, currentUser?: any) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        branchId: true,
        branch: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Kullanıcı bulunamadı');
    }

    if (currentUser) {
      this.authorizeAccess(user, currentUser);
    }
    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto, currentUser: any) {
    const userToUpdate = await this.prisma.user.findUnique({ where: { id } });

    if (!userToUpdate) {
      throw new NotFoundException('Kullanıcı bulunamadı');
    }

    this.authorizeAccess(userToUpdate, currentUser);

    if (currentUser.role === UserRole.BRANCH_MANAGER && updateUserDto.branchId && updateUserDto.branchId !== currentUser.branchId) {
      throw new ForbiddenException('Kullanıcıların şubesini değiştiremezsiniz.');
    }

    if (updateUserDto.password) {
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    return this.prisma.user.update({
      where: { id },
      data: updateUserDto,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        branchId: true,
      },
    });
  }

  async remove(id: string, currentUser: any) {
    const userToRemove = await this.prisma.user.findUnique({ where: { id } });

    if (!userToRemove) {
      throw new NotFoundException('Kullanıcı bulunamadı');
    }

    this.authorizeAccess(userToRemove, currentUser);

    return this.prisma.user.delete({ where: { id } });
  }

  private authorizeAccess(targetUser: { branchId: string | null }, currentUser: any) {
    if (currentUser.role === UserRole.ADMIN) {
      return;
    }

    if (currentUser.role === UserRole.SUPER_BRANCH_MANAGER) {
      if (!targetUser.branchId || !currentUser.branchIds?.includes(targetUser.branchId)) {
        throw new ForbiddenException('Bu şubedeki kullanıcılara erişim yetkiniz yok.');
      }
    } else {
      if (targetUser.branchId !== currentUser.branchId) {
        throw new ForbiddenException('Sadece kendi şubenizdeki kullanıcıları yönetebilirsiniz.');
      }
    }
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
      include: { branch: true },
    });
  }

  async getBranchById(id: string) {
    return this.prisma.branch.findUnique({
      where: { id },
    });
  }
}
