/*
AI Assistance Disclosure:
Tool: Github Copilot, date: 16 Sep 2025
Scope: Generated boilerplate for this file from the team's requirements and guidance. Also refactored some messy parts and added clarifying comments. Suggested tests for edge-cases based on user-specified scenarios.
Author review: I validated correctness against the team's requirements, ran tests, then improved clarity and debugged interactions with other components.
*/
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

  updateUserInDatabase = async ({
    id,
    name,
    avatar_url,
  }: {
    id: string;
    name: string;
    avatar_url?: string;
  }) => {
    const { data, error } = await supabase
      .from("users")
      .update({ name, avatar_url })
      .eq("id", id)
      .select();

    if (error) {
      logger.error(
        `UserRepository: updateUserInDatabase error: ${error.message}`
      );
      throw new Error(`Error updating user: ${error.message}`);
    }
    logger.info(
      `UserRepository: updateUserInDatabase success: ${JSON.stringify(data)}`
    );
    return data;
  };
}
