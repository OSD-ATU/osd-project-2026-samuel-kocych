import { Request, Response, NextFunction } from "express";
import { verify as jwtVerify } from "jsonwebtoken";

export const validJWTProvided = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const authHeader = req.headers?.authorization;

  if (!authHeader || !authHeader?.startsWith("Bearer")) {
    console.log("No header " + authHeader);
    res.status(401).send();
    return;
  }

  const token: string | undefined = authHeader.split(" ")[1];

  if (!token) {
    res.status(401).send();
    return;
  }
  const secret = process.env.JWTSECRET!;

  try {
    console.log(token);
    const payload = jwtVerify(token, secret);
    res.locals.payload = payload;
    next();
  } catch (err) {
    res.status(403).send();
    return;
  }
};

export const requireRole = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const role = res.locals?.payload?.role;
    if (role === undefined || role === null)
      return res.status(401).json({ message: "Not authenticated" });

    if (allowedRoles.includes(role)) {
      next();
    } else {
      return res.status(403).json({ message: "Forbidden: insufficient role" });
    }
  };
};
