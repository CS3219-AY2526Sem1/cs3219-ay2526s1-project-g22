/*
AI Assistance Disclosure:
Tool: Github Copilot, date: 16 Sep 2025
Scope: Generated boilerplate for this file from the team's requirements and guidance. Also refactored some messy parts and added clarifying comments. Suggested tests for edge-cases based on user-specified scenarios.
Author review: I validated correctness against the team's requirements, ran tests, then improved clarity and debugged interactions with other components.
*/
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
  userRouter.put("/", userController.updateUser);

  expressApp.use("/v1/users", authenticateUser, userRouter);
}
