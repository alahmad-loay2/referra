import { supabase } from "../lib/supabase.js";
import { prisma } from "../lib/prisma.js";
import { NODE_ENV } from "../config/env.js";

// Middleware for authentication and role-based access control
// handle refreshing tokens and attaching user info to req object

const throwAuthError = () => {
  const error = new Error("Authentication required. Please sign in again.");
  error.statusCode = 401;
  throw error;
};

const attachUser = async (req, supabaseUser, next) => {
  const user = await prisma.users.findUnique({
    where: { UserId: supabaseUser.id },
    include: { Employee: true, Hr: true },
  });

  if (!user) {
    const error = new Error("User not found. Please verify your email.");
    error.statusCode = 404;
    throw error;
  }

  req.user = {
    UserId: user.UserId,
    Email: user.Email,
    Role: user.Role,
    Employee: user.Employee,
    Hr: user.Hr,
  };

  req.supabaseUserId = supabaseUser.id;
  next();
};

export const requireHr = (req, res, next) => {
  if (!req.user || req.user.Role !== "HR") {
    return res.status(403).json({ message: "HR access required" });
  }
  return next();
};

export const requireEmployee = (req, res, next) => {
  if (!req.user || req.user.Role !== "Employee" || !req.user.Employee) {
    return res.status(403).json({ message: "Employee access required" });
  }
  return next();
};

export const authenticate = async (req, res, next) => {
  try {
    const accessToken = req.cookies?.accessToken;
    const refreshToken = req.cookies?.refreshToken;

    if (!accessToken && !refreshToken) {
      throwAuthError();
    }

    const { data, error } = await supabase.auth.getUser(accessToken);

    if (!error && data?.user) {
      return attachUser(req, data.user, next);
    }

    if (!refreshToken) {
      throwAuthError();
    }

    const { data: refreshed, error: refreshError } =
      await supabase.auth.refreshSession({
        refresh_token: refreshToken,
      });

    if (refreshError || !refreshed.session) {
      throwAuthError();
    }

    const isProd = NODE_ENV === "production";

    res.cookie("accessToken", refreshed.session.access_token, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: 15 * 60 * 1000,
    });

    res.cookie("refreshToken", refreshed.session.refresh_token, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return attachUser(req, refreshed.session.user, next);
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        message: error.message || "Authentication required. Please sign in again.",
      });
    }
    next(error);
  }
};
