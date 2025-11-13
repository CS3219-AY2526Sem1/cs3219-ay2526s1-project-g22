/*
AI Assistance Disclosure:
Tool: Github Copilot, date: 16 Sep 2025
Scope: Generated boilerplate for this file from the team's requirements and guidance. Suggested tests for edge-cases based on user-specified scenarios.
Author review: I validated correctness against the team's requirements, ran tests, then improved clarity and debugged interactions with other components.
*/
import logger from "../../../logger";
import { IUserService, IUser } from "./user.interface";
import { UserRepository } from "./user.repository";

export class UserService implements IUserService {
  constructor(private userRepository: UserRepository) {}
  postUserToDatabase = async ({ id, email, name }: IUser) => {
    const data = await this.userRepository.postUserToDatabase({
      id,
      email,
      name,
    });
    logger.info(
      `UserService: postUserToDatabase called with data: ${JSON.stringify(
        data
      )}`
    );

    return data;
  };

  getUserFromDataBase = async ({ id }: { id: string }) => {
    const data = await this.userRepository.getUserFromDataBase({ id });
    logger.info(
      `UserService: getUserFromDataBase called with id: ${JSON.stringify(id)}`
    );
    // get the only user from the data array
    return data[0];
  };

  updateUserInDatabase = async ({
    id,
    name,
    avatar_url,
  }: {
    id: string;
    name: string;
    avatar_url?: string;
  }) => {
    const data = await this.userRepository.updateUserInDatabase({
      id,
      name,
      avatar_url,
    });
    logger.info(
      `UserService: updateUserInDatabase called with id: ${JSON.stringify(
        id
      )} and name: ${JSON.stringify(name)} and avatar_url: ${JSON.stringify(
        avatar_url
      )}`
    );
    return data;
  };
}
