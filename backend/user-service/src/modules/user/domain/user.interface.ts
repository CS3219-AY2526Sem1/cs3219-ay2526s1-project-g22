export interface IUser {
  id: string;
  email: string;
  name: string;
}
export interface IUserService {
  postUserToDatabase: ({ id, email, name }: IUser) => any;
  getUserFromDataBase: ({ id }: { id: string }) => any;
}
