import { signupUser, verifyEmailService, signinUser, forgotPassword, resetPassword, bootstrapFirstHr, createHrUser } from "../services/auth/auth.service.js";

export const signup = async (req, res, next) => {
  try {
    const result = await signupUser(req.body);

    res.status(201).json({
      message: result.message
    });
  } catch (error) {
    next(error);
  }
};


export const signin = async (req, res, next) => {
  try {
    const result = await signinUser(req.body);

    res.cookie("accessToken", result.accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: 15 * 60 * 1000,
    });

    res.cookie("refreshToken", result.refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
      message: "Signed in successfully",
      user: result.user,
      emailVerified: result.emailVerified,
    });
  } catch (error) {
    next(error);
  }
};

export const verifyEmail = async (req, res, next) => {
  try {
    const { access_token, refresh_token } = req.body;

    if (!access_token || !refresh_token) {
      const error = new Error("Missing verification tokens");
      error.statusCode = 400;
      throw error;
    }

    const result = await verifyEmailService(access_token, refresh_token);

    res.cookie("accessToken", result.accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: 15 * 60 * 1000,
    });

    res.cookie("refreshToken", result.refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
      message: "Email verified successfully",
      user: result.user,
      emailVerified: result.emailVerified,
    });
  } catch (error) {
    next(error);
  }
};

export const logout = async (req, res, next) => {
  try {
    res.cookie("accessToken", "", {
      httpOnly: true,
      secure: true, 
      sameSite: "none", 
      maxAge: 0,
    });

    res.cookie("refreshToken", "", {
      httpOnly: true,
      secure: true,
      sameSite: "none", 
      maxAge: 0,
    });

    res.status(200).json({
      message: "Logged out successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const forgotPasswordController = async (req, res, next) => {
  try {
    const { email } = req.body;
    const result = await forgotPassword(email);

    res.status(200).json({
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
};

export const resetPasswordController = async (req, res, next) => {
  try {
    const { access_token, refresh_token, new_password } = req.body;

    if (!access_token || !refresh_token || !new_password) {
      const error = new Error("Access token, refresh token, and new password are required");
      error.statusCode = 400;
      throw error;
    }

    const result = await resetPassword(access_token, refresh_token, new_password);

    res.cookie("accessToken", result.accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: 15 * 60 * 1000,
    });

    res.cookie("refreshToken", result.refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
};

export const bootstrapFirstHrController = async (req, res, next) => {
  try {
    const result = await bootstrapFirstHr(req.body);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

export const createHrController = async (req, res, next) => {
  try {
    const result = await createHrUser(req.body);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};
