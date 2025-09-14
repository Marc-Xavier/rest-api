import {
  Controller,
  Get,
  Param,
  Post,
  Body,
  Put,
  Delete,
  HttpCode,
  HttpStatus,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { UsersService } from "./users.service";
import { CreateUserDto } from "./dto/create-user.dto";
import { LoginDto } from "./dto/login.dto";
import { UpdateUserDto } from "./dto/update-user.dto";

@Controller()
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get("users")
  async getUsers() {
    const all = await this.users.findAll();
    if (!all || all.length === 0) {
      throw new NotFoundException("No users at this time..");
    }
    return { total_user: all.length, allUsers: all };
  }

  @Get("user/:id")
  async getUser(@Param("id") id: string) {
    const user = await this.users.findOne(id);
    if (!user) throw new NotFoundException("User not found!");
    return { user };
  }

  @Post("register")
  async register(@Body() body: CreateUserDto) {
    const newUser = await this.users.create(body);
    return { newUser };
  }

  @Post("login")
  @HttpCode(HttpStatus.OK)
  async login(@Body() body: LoginDto) {
    const { email, password } = body;

    const userByEmail = await this.users.findByEmail(email);
    if (!userByEmail) {
      throw new NotFoundException("No user exists with the email provided..");
    }

    const user = await this.users.comparePassword(email, password);
    if (!user) {
      throw new BadRequestException("Incorrect Password!");
    }

    return { user };
  }

  @Put("user/:id")
  async update(@Param("id") id: string, @Body() body: UpdateUserDto) {
    // mimic your original check that all three are required for PUT
    if (!body.username || !body.email || !body.password) {
      throw new BadRequestException(
        "Please provide all the required parameters.."
      );
    }
    const updated = await this.users.update(id, body);
    return { updateUser: updated };
  }

  @Delete("user/:id")
  async remove(@Param("id") id: string) {
    await this.users.remove(id);
    return { msg: "User deleted" };
  }
}
