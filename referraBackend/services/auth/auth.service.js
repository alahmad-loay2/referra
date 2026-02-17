import { supabase } from "../../lib/supabase.js"; // used for auth operations and CV storage
import { prisma } from "../../lib/prisma.js"; // used for database operations
import { FRONTEND_URL } from "../../config/env.js";

// Sign up a new employee with supabase and send verification email
export const signupUser = async (payload) => {
  const {
    firstName,
    lastName,
    age,
    phoneNumber,
    gender,
    email,
    password,
    department,
  } = payload;

  if (
    !firstName ||
    !lastName ||
    !age ||
    !phoneNumber ||
    !gender ||
    !email ||
    !password
  ) {
    const error = new Error("All fields are required");
    error.statusCode = 400;
    throw error;
  }

  const verifiedUser = await prisma.users.findUnique({
    where: { Email: email },
  });

  if (verifiedUser) {
    const error = new Error("User already exists and is verified");
    error.statusCode = 400;
    throw error;
  }

  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${FRONTEND_URL}/auth/verify-email-success`,
      data: {
        firstName,
        lastName,
        age,
        phoneNumber,
        gender,
        department: department || "General",
      },
    },
  });

  if (authError) {
    if (authError.message && authError.message.includes("already registered")) {
      return {
        message:
          "Verification email sent. Please verify your email to complete signup.",
      };
    }
    const error = new Error(authError.message || "Failed to create user");
    error.statusCode = 400;
    throw error;
  }

  return {
    message:
      "Verification email sent. Please verify your email to complete signup.",
  };
};

// Verify email using tokens from verification link and create user in prisma
export const verifyEmailService = async (accessToken, refreshToken) => {
  if (!accessToken || !refreshToken) {
    const error = new Error("Missing verification tokens");
    error.statusCode = 400;
    throw error;
  }

  const { data: sessionData, error: sessionError } =
    await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

  if (sessionError || !sessionData.session) {
    const error = new Error("Invalid or expired verification link");
    error.statusCode = 400;
    throw error;
  }

  const supabaseUser = sessionData.session.user;

  let user = await prisma.users.findUnique({
    where: { UserId: supabaseUser.id },
    include: { Employee: true, Hr: true },
  });

  if (!user) {
    const meta = supabaseUser.user_metadata || {};

    user = await prisma.users.create({
      data: {
        UserId: supabaseUser.id,
        FirstName: meta.firstName,
        LastName: meta.lastName,
        Age: meta.age ? parseInt(meta.age) : 0,
        PhoneNumber: meta.phoneNumber,
        Gender: meta.gender,
        Email: supabaseUser.email,
        Role: "Employee",
        Employee: {
          create: {
            Department: meta.department || "General",
            TotalCompensation: 0,
            Position: "Employee",
          },
        },
      },
      include: { Employee: true },
    });
  }

  return {
    user: {
      UserId: user.UserId,
      Email: user.Email,
      Role: user.Role,
    },
    accessToken: sessionData.session.access_token,
    refreshToken: sessionData.session.refresh_token,
    emailVerified: supabaseUser.email_confirmed_at !== null,
  };
};

// Sign in user and return tokens along with user info
export const signinUser = async (payload) => {
  const { email, password } = payload;

  if (!email || !password) {
    const error = new Error("Email and password are required");
    error.statusCode = 400;
    throw error;
  }

  const { data: authData, error: authError } =
    await supabase.auth.signInWithPassword({
      email,
      password,
    });

  if (authError) {
    const error = new Error(authError.message || "Invalid email or password");
    error.statusCode = 401;
    throw error;
  }

  if (!authData.session) {
    const error = new Error("Failed to create session");
    error.statusCode = 500;
    throw error;
  }

  const supabaseUser = authData.user;

  // First, load base user data without heavy relations
  const baseUser = await prisma.users.findUnique({
    where: { UserId: supabaseUser.id },
    select: {
      UserId: true,
      Email: true,
      Role: true,
    },
  });

  if (!baseUser) {
    const error = new Error("Please verify your email before signing in");
    error.statusCode = 403;
    throw error;
  }

  const isHr = baseUser.Role === "HR";

  if (!supabaseUser.email_confirmed_at && !isHr) {
    const error = new Error("Please verify your email before signing in");
    error.statusCode = 403;
    throw error;
  }

  // For HR users, ensure an HR profile exists (but don't load departments here)
  if (baseUser.Role === "HR") {
    const hrProfile = await prisma.hr.findUnique({
      where: { UserId: baseUser.UserId },
    });

    if (!hrProfile) {
      const error = new Error(
        "HR profile not found. Please contact an administrator.",
      );
      error.statusCode = 403;
      throw error;
    }
  }

  // For Employee users, ensure an Employee profile exists
  if (baseUser.Role === "Employee") {
    const employeeProfile = await prisma.employee.findUnique({
      where: { UserId: baseUser.UserId },
    });

    if (!employeeProfile) {
      const error = new Error(
        "Employee profile not found. Please contact an administrator.",
      );
      error.statusCode = 403;
      throw error;
    }
  }

  return {
    user: {
      UserId: baseUser.UserId,
      Email: baseUser.Email,
      Role: baseUser.Role,
    },
    accessToken: authData.session.access_token, // dies every 15 mins
    refreshToken: authData.session.refresh_token, // dies  after a week
    emailVerified: !!supabaseUser.email_confirmed_at || isHr,
  };
};

// Bootstrap the first HR user in the system
export const bootstrapFirstHr = async (payload) => {
  const {
    email,
    password,
    firstName,
    lastName,
    age,
    phoneNumber,
    gender,
    departmentName,
    admin = true, // default to true for the first HR
  } = payload || {};

  if (
    !email ||
    !password ||
    !firstName ||
    !lastName ||
    !age ||
    !phoneNumber ||
    !gender ||
    !departmentName
  ) {
    const error = new Error(
      "email, password, firstName, lastName, age, phoneNumber, gender, departmentName are required",
    );
    error.statusCode = 400;
    throw error;
  }

  // Create or reuse a department for the first HR by name
  const department = await prisma.department.upsert({
    where: { DepartmentName: departmentName },
    update: {},
    create: {
      DepartmentName: departmentName,
    },
  });

  const existingHr = await prisma.hr.findFirst();
  if (existingHr) {
    const error = new Error("HR already exists. Bootstrap is disabled.");
    error.statusCode = 403;
    throw error;
  }

  const existingUserByEmail = await prisma.users.findUnique({
    where: { Email: email },
  });
  if (existingUserByEmail) {
    const error = new Error("User already exists in Prisma");
    error.statusCode = 400;
    throw error;
  }

  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        firstName,
        lastName,
        age,
        phoneNumber,
        gender,
        role: "HR",
        departmentId: department.DepartmentId,
        isAdmin: admin,
      },
    },
  });

  if (authError) {
    const error = new Error(
      authError.message || "Failed to create HR auth user",
    );
    error.statusCode = 400;
    throw error;
  }

  if (!authData.user) {
    const error = new Error("Failed to create Supabase user");
    error.statusCode = 500;
    throw error;
  }

  const supabaseUser = authData.user;

  const user = await prisma.users.create({
    data: {
      UserId: supabaseUser.id,
      Email: email,
      FirstName: firstName,
      LastName: lastName,
      Age: typeof age === "number" ? age : parseInt(age, 10),
      PhoneNumber: phoneNumber,
      Gender: gender,
      Role: "HR",
      Hr: {
        create: {
          isAdmin: admin,
        },
      },
      // Also create linked Employee record so HR can submit referrals
      Employee: {
        create: {
          Department: "HR",
          TotalCompensation: 0,
          Position: "HR",
        },
      },
    },
    include: { Hr: true, Employee: true },
  });
  // 🔗 link HR to department
  await prisma.hrDepartment.create({
    data: {
      HrId: user.Hr.HrId,
      DepartmentId: department.DepartmentId,
    },
  });

  return {
    message: "First HR bootstrapped successfully",
    user: { UserId: user.UserId, Email: user.Email, Role: user.Role },
  };
};

// allow hr users to be created by existing hr users and send them invite email
export const createHrUser = async (payload) => {
  const {
    email,
    firstName,
    lastName,
    age,
    phoneNumber,
    gender,
    departmentIds,
  } = payload || {};

  if (
    !email ||
    !firstName ||
    !lastName ||
    !age ||
    !phoneNumber ||
    !gender ||
    !Array.isArray(departmentIds) ||
    departmentIds.length === 0
  ) {
    const error = new Error(
      "email, firstName, lastName, age, phoneNumber, gender, departmentIds are required",
    );
    error.statusCode = 400;
    throw error;
  }

  const departments = await prisma.department.findMany({
    where: {
      DepartmentId: {
        in: departmentIds,
      },
    },
  });

  if (departments.length !== departmentIds.length) {
    const error = new Error("One or more departments not found");
    error.statusCode = 404;
    throw error;
  }

  const existingByEmail = await prisma.users.findUnique({
    where: { Email: email },
    include: { Employee: true, Hr: true },
  });

  if (existingByEmail) {
    if (existingByEmail.Role === "Employee" || existingByEmail.Employee) {
      const error = new Error("Cannot create HR for an existing Employee user");
      error.statusCode = 403;
      throw error;
    }

    if (existingByEmail.Role === "HR" && existingByEmail.Hr) {
      return {
        message: "HR already exists",
        user: {
          UserId: existingByEmail.UserId,
          Email: existingByEmail.Email,
          Role: existingByEmail.Role,
        },
      };
    }
  }

  const tempPassword = Math.random().toString(36).slice(-12) + "Aa1!";

  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password: tempPassword,
    options: {
      emailRedirectTo: `${FRONTEND_URL}/auth/reset-password`,
      data: {
        firstName,
        lastName,
        age,
        phoneNumber,
        gender,
        role: "HR",
        departmentIds,
      },
    },
  });

  if (authError) {
    const alreadyRegistered =
      authError.message &&
      authError.message.toLowerCase().includes("already registered");

    if (!alreadyRegistered) {
      const error = new Error(
        authError.message || "Failed to create HR auth user",
      );
      error.statusCode = 400;
      throw error;
    }
  }

  return {
    message:
      "HR invite created. The user must set their password from the email link.",
  };
};

// Send password reset email to user
export const forgotPassword = async (email) => {
  if (!email) {
    const error = new Error("Email is required");
    error.statusCode = 400;
    throw error;
  }

  const user = await prisma.users.findUnique({
    where: { Email: email },
  });

  if (!user) {
    return {
      message:
        "If an account exists with this email, a password reset link has been sent.",
    };
  }

  const { error: resetError } = await supabase.auth.resetPasswordForEmail(
    email,
    {
      redirectTo: `${FRONTEND_URL}/auth/reset-password`,
    },
  );

  if (resetError) {
    const error = new Error(
      resetError.message || "Failed to send password reset email",
    );
    error.statusCode = 400;
    throw error;
  }

  return {
    message:
      "If an account exists with this email, a password reset link has been sent.",
  };
};

// Reset user password using tokens from reset link
export const resetPassword = async (accessToken, refreshToken, newPassword) => {
  if (!accessToken || !refreshToken || !newPassword) {
    const error = new Error(
      "Access token, refresh token, and new password are required",
    );
    error.statusCode = 400;
    throw error;
  }

  if (newPassword.length < 6) {
    const error = new Error("Password must be at least 6 characters long");
    error.statusCode = 400;
    throw error;
  }

  const { data: sessionData, error: sessionError } =
    await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

  if (sessionError || !sessionData.session) {
    const error = new Error("Invalid or expired reset link");
    error.statusCode = 400;
    throw error;
  }

  const supabaseUser = sessionData.session.user;

  const userMetadata = supabaseUser.user_metadata || {};
  const resetTokenHash = accessToken.substring(0, 20);
  const usedResetTokens = userMetadata.usedResetTokens || [];

  if (usedResetTokens.includes(resetTokenHash)) {
    const error = new Error(
      "This reset link has already been used. Please request a new password reset email.",
    );
    error.statusCode = 400;
    throw error;
  }

  const { error: updateError } = await supabase.auth.updateUser({
    password: newPassword,
    data: {
      ...userMetadata,
      usedResetTokens: [...usedResetTokens, resetTokenHash],
    },
  });

  if (updateError) {
    const error = new Error(updateError.message || "Failed to update password");
    error.statusCode = 400;
    throw error;
  }

  if (userMetadata.role === "HR") {
    const existingPrismaUser = await prisma.users.findUnique({
      where: { UserId: supabaseUser.id },
      include: { Hr: true, Employee: true },
    });

    // Always ensure HR user has Employee record (for submitting referrals)
    if (
      existingPrismaUser &&
      existingPrismaUser.Hr &&
      !existingPrismaUser.Employee
    ) {
      await prisma.employee.create({
        data: {
          UserId: existingPrismaUser.UserId,
          Department: "HR",
          TotalCompensation: 0,
          Position: "HR",
        },
      });
    }

    if (!existingPrismaUser) {
      const { firstName, lastName, age, phoneNumber, gender, departmentIds } =
        userMetadata;
      if (!Array.isArray(departmentIds) || departmentIds.length === 0) {
        throw Object.assign(
          new Error("HR departments are missing. Contact administrator."),
          { statusCode: 400 },
        );
      }

      const createdUser = await prisma.users.create({
        data: {
          UserId: supabaseUser.id,
          Email: supabaseUser.email,
          FirstName: firstName,
          LastName: lastName,
          Age: age ? parseInt(age, 10) : 0,
          PhoneNumber: phoneNumber || "N/A",
          Gender: gender || "N/A",
          Role: "HR",
          Hr: {
            create: {}, // HR created without department
          },
          // Also create linked Employee record so HR can submit referrals
          Employee: {
            create: {
              Department: "HR",
              TotalCompensation: 0,
              Position: "HR",
            },
          },
        },
        include: { Hr: true, Employee: true },
      });

      //  Link HR to department (NEW SCHEMA)
      await prisma.hrDepartment.createMany({
        data: departmentIds.map((depId) => ({
          HrId: createdUser.Hr.HrId,
          DepartmentId: depId,
        })),
      });
    }
  }

  return {
    message: "Password has been reset successfully",
    accessToken: sessionData.session.access_token,
    refreshToken: sessionData.session.refresh_token,
  };
};
