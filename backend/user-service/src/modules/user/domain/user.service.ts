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

  updateUserInDatabase = async ({ id, name }: { id: string; name: string }) => {
    const data = await this.userRepository.updateUserInDatabase({ id, name });
    logger.info(
      `UserService: updateUserInDatabase called with id: ${JSON.stringify(
        id
      )} and name: ${JSON.stringify(name)}`
    );
    return data;
  };
}
