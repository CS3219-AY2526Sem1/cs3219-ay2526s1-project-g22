import type { Request, Response, NextFunction } from "express";
import { UserController } from "../domain/user.controller";
import { UserRepository } from "../domain/user.repository";
import { UserService } from "../domain/user.service";
import { IUser } from "../domain/user.interface";

describe("IUser Service", () => {
  let userService: UserService;
  let userRepository: UserRepository;
  beforeEach(() => {
    userRepository = {
      postUserToDatabase: jest.fn(),
      getUserFromDataBase: jest.fn(),
    } as unknown as UserRepository;
    userService = new UserService(userRepository);
  });
  it("should post user to database", async () => {
    const user = { id: "1", email: "a@gmail.com", name: "Alice" };
    (userRepository.postUserToDatabase as jest.Mock).mockResolvedValue(user);
    const result = await userService.postUserToDatabase(user);
    expect(result).toEqual(user);
    expect(userRepository.postUserToDatabase).toHaveBeenCalledWith(user);
  });
  it("should get user from database", async () => {
    const user: IUser = {
      id: "f47ac10b-58cc-4372-a567-0e02b2c3d479",
      email: "a@gmail.com",
      name: "Alice",
    };

    (userRepository.getUserFromDataBase as jest.Mock).mockResolvedValue([user]);
    const result = await userService.getUserFromDataBase({
      id: "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    });
    expect(result).toEqual(user);
    expect(userRepository.getUserFromDataBase).toHaveBeenCalledWith({
      id: "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    });
  });
  it("should throw an error if postUserToDatabase fails", async () => {
    const error = new Error("Database error");
    (userRepository.postUserToDatabase as jest.Mock).mockRejectedValue(error);
    await expect(
      userService.postUserToDatabase({
        id: "f47ac10b-58cc-4372-a567-0e02b2c3d479",
        email: "a@gmail.com",
        name: "Alice",
      })
    ).rejects.toThrow("Database error");
  });
  it("should throw an error if getUserFromDataBase fails", async () => {
    const error = new Error("Database error");
    (userRepository.getUserFromDataBase as jest.Mock).mockRejectedValue(error);
    await expect(
      userService.getUserFromDataBase({
        id: "f47ac10b-58cc-4372-a567-0e02b2c3d479",
      })
    ).rejects.toThrow("Database error");
  });
});

describe("IUser Controller", () => {
  let userController: UserController;
  let userService: UserService;
  let request: Partial<Request>;
  let response: Partial<Response>;
  let nextFunction: NextFunction;

  beforeEach(() => {
    // Changed from beforeAll to beforeEach
    userService = {
      postUserToDatabase: jest.fn(),
      getUserFromDataBase: jest.fn(),
    } as unknown as UserService;
    userController = new UserController(userService);
    request = {
      body: { name: "Alice", email: "test@gmail.com" },
      user: { id: "f47ac10b-58cc-4372-a567-0e02b2c3d479" },
    } as Partial<Request>;
    response = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      send: jest.fn(),
    } as Partial<Response>;
    nextFunction = jest.fn() as NextFunction;
  });

  it("should post user", async () => {
    (userService.postUserToDatabase as jest.Mock).mockResolvedValue({
      message: "User added to database",
    });
    await userController.postUser(
      request as Request,
      response as Response,
      nextFunction
    );
    expect(userService.postUserToDatabase).toHaveBeenCalledWith({
      email: "test@gmail.com",
      id: "f47ac10b-58cc-4372-a567-0e02b2c3d479",
      name: "Alice",
    });
    expect(response.status).toHaveBeenCalledWith(200);
    expect(response.json).toHaveBeenCalledWith({
      message: "User added to database",
    });
  });
  it("should get user", async () => {
    (userService.getUserFromDataBase as jest.Mock).mockResolvedValue({
      message: "User retrieved from database",
    });
    await userController.getUser(
      request as Request,
      response as Response,
      nextFunction
    );
    expect(userService.getUserFromDataBase).toHaveBeenCalledWith({
      id: "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    });
    expect(response.status).toHaveBeenCalledWith(200);
    expect(response.json).toHaveBeenCalledWith({
      message: "User retrieved from database",
    });
  });
  it("should handle errors in postUser", async () => {
    const error = new Error("Service error");
    (userService.postUserToDatabase as jest.Mock).mockRejectedValue(error);
    await userController.postUser(
      request as Request,
      response as Response,
      nextFunction
    );
    expect(nextFunction).toHaveBeenCalledWith(error);
  });
  it("should handle errors in getUser", async () => {
    const error = new Error("Service error");
    (userService.getUserFromDataBase as jest.Mock).mockRejectedValue(error);
    await userController.getUser(
      request as Request,
      response as Response,
      nextFunction
    );
    expect(nextFunction).toHaveBeenCalledWith(error);
  });
});
