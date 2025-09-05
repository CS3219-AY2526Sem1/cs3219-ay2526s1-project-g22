import supabase from "../../../lib/supabase-client";
import logger from "../../../logger";
import { IUserService, IUser } from "./user.interface";

export class UserRepository implements IUserService {
  postUserToDatabase = async ({ id, email, name }: IUser) => {
    const { data, error } = await supabase
      .from("users")
      .insert({
        id,
        email,
        name,
      })
      .select();

    if (error) {
      logger.error(
        `UserRepository: postUserToDatabase error: ${error.message}`
      );
      throw new Error(`Error inserting user: ${error.message}`);
    }
    logger.info(
      `UserRepository: postUserToDatabase success: ${JSON.stringify(data)}`
    );
    return data;
  };
  getUserFromDataBase = async ({ id }: { id: string }) => {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", id);
    if (error) {
      logger.error(
        `UserRepository: getUserFromDataBase error: ${error.message}`
      );
      throw new Error(`Error fetching user: ${error.message}`);
    }
    logger.info(
      `UserRepository: getUserFromDataBase success: ${JSON.stringify(data)}`
    );
    return data;
  };
}
