declare namespace Express {
  interface Request {
    user?: { id: string; [key: string]: any };
  }
}
