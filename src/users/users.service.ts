import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { UnitUser, User, Users } from "./interfaces/user.interface";
import * as bcrypt from "bcryptjs";
import { v4 as uuid } from "uuid";
import * as fs from "fs";

@Injectable()
export class UsersService {
  private readonly USERS_FILE = "./users.json";
  private users: Users = this.loadUsers();

  private loadUsers(): Users {
    try {
      const data = fs.readFileSync(this.USERS_FILE, "utf-8");
      return JSON.parse(data);
    } catch {
      return {};
    }
  }

  private saveUsers() {
    fs.writeFileSync(this.USERS_FILE, JSON.stringify(this.users), "utf-8");
  }

  async findAll(): Promise<UnitUser[]> {
    return Object.values(this.users);
  }

  async findOne(id: string): Promise<UnitUser | null> {
    return this.users[id] ?? null;
  }

  async findByEmail(email: string): Promise<UnitUser | null> {
    const all = await this.findAll();
    return all.find((u) => u.email === email) ?? null;
  }

  async comparePassword(
    email: string,
    suppliedPassword: string
  ): Promise<UnitUser | null> {
    const user = await this.findByEmail(email);
    if (!user) return null;
    const ok = await bcrypt.compare(suppliedPassword, user.password);
    return ok ? user : null;
  }

  async create(data: User): Promise<UnitUser> {
    const existing = await this.findByEmail(data.email);
    if (existing) {
      throw new BadRequestException("This email has already been registered..");
    }

    let id = uuid();
    while (await this.findOne(id)) id = uuid();

    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(data.password, salt);

    const user: UnitUser = {
      id,
      username: data.username,
      email: data.email,
      password: hashed,
    };
    this.users[id] = user;
    this.saveUsers();
    return user;
  }

  async update(id: string, update: Partial<User>): Promise<UnitUser> {
    const current = await this.findOne(id);
    if (!current) {
      throw new NotFoundException(`No user with id ${id}`);
    }

    const next: UnitUser = { ...current };

    if (update.username !== undefined) next.username = update.username;
    if (update.email !== undefined) next.email = update.email;

    if (update.password) {
      const salt = await bcrypt.genSalt(10);
      next.password = await bcrypt.hash(update.password, salt);
    }

    this.users[id] = next;
    this.saveUsers();
    return next;
  }

  async remove(id: string): Promise<void> {
    const user = await this.findOne(id);
    if (!user) throw new NotFoundException("User does not exist");
    delete this.users[id];
    this.saveUsers();
  }
}
