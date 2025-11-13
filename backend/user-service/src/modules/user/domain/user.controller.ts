/*
AI Assistance Disclosure:
Tool: Github Copilot, date: 16 Sep 2025
Scope: Generated boilerplate for this file from the team's requirements and guidance. Also refactored some messy parts and added clarifying comments. Suggested tests for edge-cases based on user-specified scenarios.
Author review: I validated correctness against the team's requirements, ran tests, then improved clarity and debugged interactions with other components.
*/
import type { NextFunction, Request, Response } from "express";
import {
  validateGetUser,
  validatePostUser,
  validateUpdateUser,
} from "./user.validator";
import { UserService } from "./user.service";
import logger from "../../../logger";

export class UserController {
  constructor(private userService: UserService) {}
  postUser = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const { name, email } = req.body;
    const id = req.user.id;
    try {
      const parsedData = validatePostUser({ id, email, name });
      logger.info(
        `UserController: postUser called with data: ${JSON.stringify(
          parsedData
        )}`
      );
      await this.userService.postUserToDatabase(parsedData);
      res.status(200).json({ message: "User added to database" });
    } catch (error) {
      next(error);
    }
  };
  getUser = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const id = req.user.id;
    try {
      const parsedId = validateGetUser({ id });
      logger.info(
        `UserController: getUser called with id: ${JSON.stringify(parsedId)}`
      );
      const user = await this.userService.getUserFromDataBase(parsedId);
      res.status(200).json(user);
    } catch (error) {
      next(error);
    }
  };

  updateUser = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const { name, avatar_url } = req.body;
    const id = req.user.id;
    try {
      const parsedData = validateUpdateUser({ id, name, avatar_url });
      logger.info(
        `UserController: updateUser called with data: ${JSON.stringify(
          parsedData
        )}`
      );
      await this.userService.updateUserInDatabase(parsedData);
      res.status(200).json({ message: "User updated in database" });
    } catch (error) {
      next(error);
    }
  };
}
