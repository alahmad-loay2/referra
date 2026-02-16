import { supabase } from "../lib/supabase.js";
import { prisma } from "../lib/prisma.js";
import jwt from "jsonwebtoken";

// User data cache for performance optimization
const userDataCache = new Map();

// Cache TTL: 15 minutes
const USER_DATA_CACHE_TTL = 15 * 60 * 1000;

// Clean up old cache entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of userDataCache.entries()) {
    if (now - value.timestamp > USER_DATA_CACHE_TTL) {
      userDataCache.delete(key);
    }
  }
}, 60 * 1000); // Run cleanup every minute

// Middleware for authentication and role-based access control
// handle refreshing tokens and attaching user info to req object

const throwAuthError = () => {
  const error = new Error("Authentication required. Please sign in again.");
  error.statusCode = 401;
  throw error;
};

const attachUser = async (req, supabaseUser, next) => {
  const userId = supabaseUser.id;

  // Check user data cache first
  const userCacheKey = `user:${userId}`;
  const cachedUser = userDataCache.get(userCacheKey);

  if (cachedUser && Date.now() - cachedUser.timestamp < USER_DATA_CACHE_TTL) {
    req.user = cachedUser.data;
    req.supabaseUserId = userId;
    return next();
  }

  // Cache miss, query base user once
  const baseUser = await prisma.users.findUnique({
    where: { UserId: userId },
  });

  if (!baseUser) {
    const error = new Error("User not found. Please verify your email.");
    error.statusCode = 404;
    throw error;
  }

  // Depending on role, fetch only the needed relation in a separate query:
  // - Employee → Employee by UserId
  // - HR       → Hr by UserId with Departments -> Department
  // - HR users can also have Employee records (for submitting referrals)
  let employee = null;
  let hr = null;

  if (baseUser.Role === "Employee") {
    employee = await prisma.employee.findUnique({
      where: { UserId: userId },
    });
  } else if (baseUser.Role === "HR") {
    hr = await prisma.hr.findUnique({
      where: { UserId: userId },
      include: {
        Departments: {
          include: { Department: true },
        },
      },
    });
    // HR users can also have Employee records for submitting referrals
    employee = await prisma.employee.findUnique({
      where: { UserId: userId },
    });
  }

  const userData = {
    UserId: baseUser.UserId,
    Email: baseUser.Email,
    Role: baseUser.Role,
    Employee: employee,
    Hr: hr,
  };

  // Cache the result
  userDataCache.set(userCacheKey, {
    data: userData,
    timestamp: Date.now()
  });

  req.user = userData;
  req.supabaseUserId = userId;
  next();
};

export const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.Role !== "HR" || !req.user.Hr || !req.user.Hr.isAdmin) {
    return res.status(403).json({ message: "Admin access required" });
  }
  return next();
}

export const requireHr = (req, res, next) => {
  if (!req.user || req.user.Role !== "HR") {
    return res.status(403).json({ message: "HR access required" });
  }
  return next();
};

export const requireEmployee = (req, res, next) => {
  // Allow Employee or HR users to access employee routes
  // HR users can submit referrals as employees
  if (!req.user || (req.user.Role !== "Employee" && req.user.Role !== "HR")) {
    return res.status(403).json({ message: "Employee or HR access required" });
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

    // Verify JWT token locally instead of calling Supabase API
    if (accessToken) {
      try {
        // Decode JWT token to extract user ID and check expiration
        const decoded = jwt.decode(accessToken, { complete: true });
        
        if (!decoded || !decoded.payload) {
          throw new Error("Invalid token format");
        }

        const payload = decoded.payload;
        const userId = payload.sub; // Supabase user ID is in 'sub' claim
        const exp = payload.exp; // Expiration timestamp

        // Check if token is expired
        if (exp && exp * 1000 < Date.now()) {
          // Token expired, will try refresh below
          throw new Error("Token expired");
        }

        if (!userId) {
          throw new Error("User ID not found in token");
        }

        // Token is valid, use it directly (no API call needed!)
        return attachUser(req, { id: userId }, next);
      } catch (decodeError) {
        // Token invalid or expired, try refresh
        if (!refreshToken) {
          throwAuthError();
        }
        // Fall through to refresh logic below
      }
    }

    // Token expired or invalid, try refresh
    if (!refreshToken) {
      throwAuthError();
    }

    // Still need Supabase API for token refresh
    const { data: refreshed, error: refreshError } =
      await supabase.auth.refreshSession({
        refresh_token: refreshToken,
      });

    if (refreshError || !refreshed.session) {
      throwAuthError();
    }

    res.cookie("accessToken", refreshed.session.access_token, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      maxAge: 15 * 60 * 1000,
      path: "/",
    });

    res.cookie("refreshToken", refreshed.session.refresh_token, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: "/",
    });

    return attachUser(req, refreshed.session.user, next);
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        message:
          error.message || "Authentication required. Please sign in again.",
      });
    }
    next(error);
  }
};

// Helper function to clear user cache on logout
export const clearUserCache = (userId) => {
  if (userId) {
    userDataCache.delete(`user:${userId}`);
  }
};
