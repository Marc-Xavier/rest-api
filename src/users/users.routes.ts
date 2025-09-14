// src/users/users.routes.ts
import { FastifyPluginAsync } from "fastify";
import { StatusCodes } from "http-status-codes";
import { UnitUser, User } from "./user.interface";
import * as database from "./user.database";

type IdParams = { id: string };

type RegisterBody = {
  username: string;
  email: string;
  password: string;
};

type LoginBody = {
  email: string;
  password: string;
};

export const userRoutes: FastifyPluginAsync = async (fastify) => {
  // GET /users
  fastify.get("/users", async (_req, reply) => {
    try {
      const allUsers: UnitUser[] = await database.findAll();

      if (!allUsers || allUsers.length === 0) {
        return reply
          .code(StatusCodes.NOT_FOUND)
          .send({ msg: "No users at this time.." });
      }

      return reply
        .code(StatusCodes.OK)
        .send({ total_user: allUsers.length, allUsers });
    } catch (error) {
      return reply.code(StatusCodes.INTERNAL_SERVER_ERROR).send({ error });
    }
  });

  // GET /user/:id
  fastify.get<{ Params: IdParams }>("/user/:id", async (req, reply) => {
    try {
      const user: UnitUser = await database.findOne(req.params.id);

      if (!user) {
        return reply
          .code(StatusCodes.NOT_FOUND)
          .send({ error: "User not found!" });
      }

      return reply.code(StatusCodes.OK).send({ user });
    } catch (error) {
      return reply.code(StatusCodes.INTERNAL_SERVER_ERROR).send({ error });
    }
  });

  // POST /register
  fastify.post<{ Body: RegisterBody }>("/register", async (req, reply) => {
    try {
      const { username, email, password } = req.body;

      if (!username || !email || !password) {
        return reply
          .code(StatusCodes.BAD_REQUEST)
          .send({ error: "Please provide all the required parameters.." });
      }

      const existing = await database.findByEmail(email);
      if (existing) {
        return reply
          .code(StatusCodes.BAD_REQUEST)
          .send({ error: "This email has already been registered.." });
      }

      const newUser = await database.create(req.body as any);
      return reply.code(StatusCodes.CREATED).send({ newUser });
    } catch (error) {
      return reply.code(StatusCodes.INTERNAL_SERVER_ERROR).send({ error });
    }
  });

  // POST /login
  fastify.post<{ Body: LoginBody }>("/login", async (req, reply) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return reply
          .code(StatusCodes.BAD_REQUEST)
          .send({ error: "Please provide all the required parameters.." });
      }

      const user = await database.findByEmail(email);
      if (!user) {
        return reply
          .code(StatusCodes.NOT_FOUND)
          .send({ error: "No user exists with the email provided.." });
      }

      const comparePassword = await database.comparePassword(email, password);
      if (!comparePassword) {
        return reply
          .code(StatusCodes.BAD_REQUEST)
          .send({ error: "Incorrect Password!" });
      }

      return reply.code(StatusCodes.OK).send({ user });
    } catch (error) {
      return reply.code(StatusCodes.INTERNAL_SERVER_ERROR).send({ error });
    }
  });

  // PUT /user/:id
  fastify.put<{ Params: IdParams; Body: User }>(
    "/user/:id",
    async (req, reply) => {
      try {
        const { username, email, password } = req.body;

        if (!username || !email || !password) {
          return reply
            .code(StatusCodes.BAD_REQUEST)
            .send({ error: "Please provide all the required parameters.." });
        }

        const getUser = await database.findOne(req.params.id);
        if (!getUser) {
          return reply
            .code(StatusCodes.NOT_FOUND)
            .send({ error: `No user with id ${req.params.id}` });
        }

        const updateUser = await database.update(req.params.id, req.body);
        return reply.code(StatusCodes.CREATED).send({ updateUser });
      } catch (error) {
        fastify.log.error(error);
        return reply.code(StatusCodes.INTERNAL_SERVER_ERROR).send({ error });
      }
    }
  );

  // DELETE /user/:id
  fastify.delete<{ Params: IdParams }>("/user/:id", async (req, reply) => {
    try {
      const id = req.params.id;

      const user = await database.findOne(id);
      if (!user) {
        return reply
          .code(StatusCodes.NOT_FOUND)
          .send({ error: "User does not exist" });
      }

      await database.remove(id);
      return reply.code(StatusCodes.OK).send({ msg: "User deleted" });
    } catch (error) {
      return reply.code(StatusCodes.INTERNAL_SERVER_ERROR).send({ error });
    }
  });
};
