// backend\src\users\users.service.ts
import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository, FindOneOptions } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { Role } from './enums/role.enum';
import { UpdateUserDto } from './dto/update-user.dto';
import { I18nService, I18nContext } from 'nestjs-i18n';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    public readonly usersRepository: Repository<User>,
    private readonly i18n: I18nService,
  ) { }

  async create(createUserDto: CreateUserDto, role: Role = Role.Student): Promise<User> {
    const { email, name } = createUserDto;

    const lowercasedEmail = email.toLowerCase();
    const existingUser = await this.usersRepository.findOne({ where: { email: lowercasedEmail } });
    if (existingUser) {
      const message = await this.i18n.t('user.EMAIL_IN_USE', {
        lang: I18nContext.current()?.lang,
        args: { email: lowercasedEmail },
      });
      throw new ConflictException(message);
    }

    const user = this.usersRepository.create();
    user.email = lowercasedEmail;
    user.name = name;
    user.role = role;

    user.isActive = false;
    user.requiresPasswordSet = true;

    return await this.usersRepository.save(user);
  }

  async findAll(): Promise<User[]> {
    return await this.usersRepository.find();
  }

  async findAllByRole(role: Role): Promise<User[]> {
    return await this.usersRepository.find({
      where: { role }
    });
  }

  async findOne(id: string, relations: string[] = []): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: { id },
      relations,
      select: ['id', 'email', 'name', 'role', 'isActive', 'requiresPasswordSet', 'passwordResetExpires', 'createdAt', 'updatedAt', 'password']
    });
    if (!user) {
      const message = await this.i18n.t('user.USER_NOT_FOUND', {
        lang: I18nContext.current()?.lang,
        args: { id }
      });
      throw new NotFoundException(message);
    }
    return user;
  }

  async findAllByIds(ids: string[]): Promise<User[]> {
    if (!ids || ids.length === 0) return [];
    const users = await this.usersRepository.findBy({ id: In(ids) });
    if (users.length !== ids.length) {
      const foundIds = users.map(u => u.id);
      const notFoundIds = ids.filter(id => !foundIds.includes(id));
      console.warn(`Algunos usuarios no fueron encontrados por IDs: ${notFoundIds.join(', ')}`);
    }
    return users;
  }

  async findByEmail(email: string, selectPassword = false): Promise<User | null> {
    const queryOptions: FindOneOptions<User> = { where: { email: email.toLowerCase() } };
    if (selectPassword) {
      const metadata = this.usersRepository.metadata;
      const passwordColumn = metadata.columns.find(col => col.propertyName === "password");
      if (passwordColumn) {
        queryOptions.select = [...metadata.columns.map(col => col.propertyName), "password"] as (keyof User)[];
      } else {
        queryOptions.select = ['id', 'email', 'name', 'role', 'isActive', 'requiresPasswordSet', 'passwordResetExpires', 'createdAt', 'updatedAt', 'password'];
      }
    }
    return await this.usersRepository.findOne(queryOptions);
  }

  async remove(id: string): Promise<void> {
    const result = await this.usersRepository.delete(id);
    if (result.affected === 0) {
      const message = await this.i18n.t('user.USER_NOT_FOUND', {
        lang: I18nContext.current()?.lang,
        args: { id }
      });
      throw new NotFoundException(message);
    }
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    let userToUpdate = await this.usersRepository.preload({
      id: id,
      ...updateUserDto,
    });

    if (!userToUpdate) {
      const message = await this.i18n.t('user.USER_NOT_FOUND', {
        lang: I18nContext.current()?.lang,
        args: { id }
      });
      throw new NotFoundException(message);
    }

    if (updateUserDto.email) {
      const lowercasedEmail = updateUserDto.email.toLowerCase();
      if (lowercasedEmail !== userToUpdate.email) {
        const existingUserWithNewEmail = await this.usersRepository.findOne({ where: { email: lowercasedEmail } });
        if (existingUserWithNewEmail && existingUserWithNewEmail.id !== id) {
          const message = await this.i18n.t('user.EMAIL_IN_USE', {
            lang: I18nContext.current()?.lang,
            args: { email: lowercasedEmail },
          });
          throw new ConflictException(message);
        }
        userToUpdate.email = lowercasedEmail;
      }
    }

    const updatedUser = await this.usersRepository.save(userToUpdate);

    const { password, passwordResetExpires, ...result } = updatedUser;
    return result as User;
  }

  async prepareForPasswordAction(email: string): Promise<User | null> {
    const user = await this.findByEmail(email.toLowerCase());
    if (!user) {
      return null;
    }

    user.passwordResetExpires = new Date(Date.now() + 3600000);
    await this.usersRepository.save(user);
    return user;
  }

  async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt();
    return bcrypt.hash(password, salt);
  }

  async setNewPasswordForUser(user: User, newPasswordStr: string): Promise<User> {
    user.password = await this.hashPassword(newPasswordStr);
    user.passwordResetExpires = null;
    user.requiresPasswordSet = false;
    user.isActive = true;

    const savedUser = await this.usersRepository.save(user);

    const { password, passwordResetExpires, ...result } = savedUser;
    return result as User;
  }

  async setUserPassword(userId: string, newPasswordPlain: string): Promise<User> {
    const user = await this.findOne(userId);

    user.password = await this.hashPassword(newPasswordPlain);
    user.requiresPasswordSet = false;
    user.passwordResetExpires = null;
    user.isActive = true;

    const savedUser = await this.usersRepository.save(user);
    const { password, passwordResetExpires, ...result } = savedUser;
    return result as User;
  }

  async activateUser(userId: string): Promise<User> {
    const user = await this.findOne(userId);
    if (user.isActive) {
      const { password, passwordResetExpires, ...result } = user;
      return result as User;
    }
    user.isActive = true;
    const activatedUser = await this.usersRepository.save(user);

    const { password, passwordResetExpires, ...result } = activatedUser;
    return result as User;
  }
}