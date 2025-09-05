import { Application, Router } from "express";
import { authenticateUser } from "../../../../middleware/authorization";
import { UserRepository } from "../../domain/user.repository";
import { UserService } from "../../domain/user.service";
import { UserController } from "../../domain/user.controller";

export function defineUserRoutes(expressApp: Application) {
  const userRouter = Router();
  const userRepository = new UserRepository();
  const userService = new UserService(userRepository);
  const userController = new UserController(userService);
  userRouter.post("/", userController.postUser);
  userRouter.get("/", userController.getUser);

  expressApp.use("/v1/users", authenticateUser, userRouter);
}
