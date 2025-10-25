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
