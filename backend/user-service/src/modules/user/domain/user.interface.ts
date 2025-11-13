/*
AI Assistance Disclosure:
Tool: Github Copilot, date: 16 Sep 2025
Scope: Generated boilerplate for this file from the team's requirements and guidance. 
Author review: I validated correctness against the team's requirements, then improved clarity.
*/
export interface IUser {
  id: string;
  email: string;
  name: string;
}
export interface IUserService {
  postUserToDatabase: ({ id, email, name }: IUser) => any;
  getUserFromDataBase: ({ id }: { id: string }) => any;

  updateUserInDatabase: ({
    id,
    name,
    avatar_url,
  }: {
    id: string;
    name: string;
    avatar_url?: string;
  }) => any;
}
