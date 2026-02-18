import Joi from "joi";

const uuidPattern = Joi.string().uuid().required();
const emailPattern = Joi.string().email().max(255).required();
const phonePattern = Joi.string()
  .pattern(/^\+?[\s\-\(\)\.]?[0-9][\s\-\(\)\.0-9]*[0-9]$/)
  .max(32);
const dateTimePattern = Joi.date().iso();

/*
 Sanitize string to prevent XSS and SQL injection
 Removes HTML tags and dangerous SQL patterns
 */
const sanitizeString = (value) => {
  if (typeof value !== "string") return value;
  
  // Remove HTML tags
  let sanitized = value.replace(/<[^>]*>/g, "");
  
  // Trim whitespace
  sanitized = sanitized.trim();
  
  return sanitized;
};

/*
 Validate string doesn't contain SQL injection patterns
 */
const validateNoSqlInjection = (value, helpers) => {
  if (typeof value !== "string") return value;
  
  // Check for SQL injection patterns
  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE|UNION|SCRIPT)\b)/i,
    /(--|#|\/\*|\*\/|;)/,
    /(\bOR\b|\bAND\b).*?=.*?=/i,
    /'.*?'/,
  ];
  
  for (const pattern of sqlPatterns) {
    if (pattern.test(value)) {
      return helpers.error("string.noSqlInjection");
    }
  }
  
  return value;
};

/**
 * Helper to create VarChar schema with dynamic length
 * @param {number} maxLength - Maximum length from Prisma schema
 * @param {boolean} required - Whether field is required
 * @returns {Joi.Schema}
 */
const varcharSchema = (maxLength, required = true) => {
  let schema = Joi.string()
    .max(maxLength)
    .custom((value, helpers) => {
      if (typeof value !== "string") return value;
      
      // First sanitize (remove HTML and trim)
      const sanitized = sanitizeString(value);
      
      // Then validate no SQL injection
      const validated = validateNoSqlInjection(sanitized, helpers);
      
      // Return the sanitized value
      return validated;
    })
    .messages({
      "string.noSqlInjection": "Input contains potentially dangerous content",
    });
  
  return required ? schema.required() : schema.allow(null, "");
};

/**
 * Helper to create optional VarChar schema
 */
const optionalVarcharSchema = (maxLength) => varcharSchema(maxLength, false);

/**
 * Common param schemas
 */
export const paramsSchemas = {
  positionId: Joi.object({
    positionId: uuidPattern,
  }),
  referralId: Joi.object({
    referralId: uuidPattern,
  }),
  candidateId: Joi.object({
    candidateId: uuidPattern,
  }),
};

/**
 * Body schemas based on Prisma models
 */

// Users model
export const userBodySchemas = {
  signup: Joi.object({
    firstName: varcharSchema(50),
    lastName: varcharSchema(50),
    age: Joi.number().integer().min(1).max(150).required(),
    phoneNumber: phonePattern.required(),
    gender: Joi.string().valid("Male", "Female", "Other").required(),
    email: emailPattern,
    password: Joi.string().min(6).max(128).required(),
    role: Joi.string().valid("HR", "Employee").default("Employee"),
    department: Joi.string().optional(),
  }),
  
  signin: Joi.object({
    email: emailPattern,
    password: Joi.string().required(),
  }),
  
  updateUser: Joi.object({
    firstName: optionalVarcharSchema(50),
    lastName: optionalVarcharSchema(50),
    age: Joi.number().integer().min(1).max(150).optional(),
    phoneNumber: phonePattern.optional(),
    gender: Joi.string().valid("Male", "Female", "Other").optional(),
    department: Joi.string().optional().allow("", null), // For employees
    position: Joi.string().optional().allow("", null), // For employees
  }),
  
  forgotPassword: Joi.object({
    email: emailPattern,
  }),
  
  resetPassword: Joi.object({
    access_token: Joi.string().required(),
    refresh_token: Joi.string().required(),
    new_password: Joi.string().min(6).max(128).required(),
  }),
  
  verifyEmail: Joi.object({
    access_token: Joi.string().required(),
    refresh_token: Joi.string().required(),
  }),
  
  bootstrapFirstHr: Joi.object({
    firstName: varcharSchema(50),
    lastName: varcharSchema(50),
    age: Joi.number().integer().min(1).max(150).required(),
    phoneNumber: phonePattern.required(),
    gender: varcharSchema(32),
    email: emailPattern,
    password: Joi.string().min(6).max(128).required(),
    departmentName: varcharSchema(100),
  }),
  
  createHr: Joi.object({
    firstName: varcharSchema(50),
    lastName: varcharSchema(50),
    age: Joi.number().integer().min(1).max(150).required(),
    phoneNumber: phonePattern.required(),
    gender: Joi.string().valid("Male", "Female", "Other").required(),
    email: emailPattern,
    // match service: expects an array of departmentIds (string IDs), and password is auto-generated
    // we only enforce non-empty strings here; Prisma will enforce actual FK validity
    departmentIds: Joi.array()
      .items(Joi.string().trim().required())
      .min(1)
      .required(),
  }),
};

// Candidate model
export const candidateBodySchemas = {
  createReferral: Joi.object({
    candidateFirstName: varcharSchema(50),
    candidateLastName: varcharSchema(50),
    candidateEmail: emailPattern,
    candidatePhoneNumber: phonePattern.required(),
    candidateYearOfExperience: Joi.number().integer().min(0).max(100).required(),
    positionId: uuidPattern,
  }),
  
  editCandidate: Joi.object({
    candidateFirstName: optionalVarcharSchema(50),
    candidateLastName: optionalVarcharSchema(50),
    candidateEmail: emailPattern.optional(),
    candidatePhoneNumber: phonePattern.optional(),
    candidateYearOfExperience: Joi.number().integer().min(0).max(100).optional(),
  }),
};

// Position model
export const positionBodySchemas = {
  createPosition: Joi.object({
    positionTitle: varcharSchema(100),
    companyName: varcharSchema(100),
    yearsRequired: Joi.number().integer().min(0).max(100).required(),
    description: Joi.string()
      .max(3000)
      .custom((value, helpers) => {
        if (typeof value !== "string") return value;
        const sanitized = sanitizeString(value);
        return validateNoSqlInjection(sanitized, helpers);
      })
      .required()
      .allow(""),
    timeZone: varcharSchema(64),
    deadline: dateTimePattern.required(),
    positionLocation: varcharSchema(100),
    positionState: Joi.string().valid("OPEN", "CLOSED").default("OPEN"),
    // DepartmentId is stored as a string in Prisma; enforce non-empty string
    departmentId: Joi.string().trim().required(),
    employmentType: Joi.string().valid("FULL_TIME", "PART_TIME", "CONTRACT", "INTERNSHIP", "TEMPORARY").required(),
  }),
  
  updatePosition: Joi.object({
    positionTitle: optionalVarcharSchema(100),
    companyName: optionalVarcharSchema(100),
    yearsRequired: Joi.number().integer().min(0).max(100).optional(),
    description: Joi.string()
      .max(3000)
      .custom((value, helpers) => {
        if (typeof value !== "string") return value;
        const sanitized = sanitizeString(value);
        return validateNoSqlInjection(sanitized, helpers);
      })
      .optional()
      .allow(""),
    timeZone: optionalVarcharSchema(64),
    deadline: dateTimePattern.optional(),
    positionLocation: optionalVarcharSchema(100),
    positionState: Joi.string().valid("OPEN", "CLOSED").optional(),
    // Optional department change, still just a string ID
    departmentId: Joi.string().trim().optional(),
    employmentType: Joi.string().valid("FULL_TIME", "PART_TIME", "CONTRACT", "INTERNSHIP", "TEMPORARY").optional(),
  }),
  
  updatePositionState: Joi.object({
    state: Joi.string().valid("OPEN", "CLOSED").required(),
  }),
};

// Department model
export const departmentBodySchemas = {
  createDepartment: Joi.object({
    name: varcharSchema(100),
  }),
};

// Referral model
export const referralBodySchemas = {
  finalizeReferral: Joi.object({
    action: Joi.string().valid("hire", "reject").required(),
    compensation: Joi.number().integer().min(0).optional(),
  }),
};

// Query parameter schemas
export const querySchemas = {
  pagination: Joi.object({
    page: Joi.string().pattern(/^\d+$/).optional(),
    pageSize: Joi.string().pattern(/^\d+$/).optional(),
    search: Joi.string().max(255).custom((value, helpers) => {
      const sanitized = sanitizeString(value);
      return validateNoSqlInjection(sanitized, helpers);
    }).optional(),
    status: Joi.string().valid("Pending", "Confirmed", "InterviewOne", "InterviewTwo", "Acceptance", "Hired").optional(),
    createdAt: Joi.string().optional(),
    createdAfter: Joi.string().optional(),
    positionId: uuidPattern.optional(),
    onlyInProgress: Joi.string().valid("true", "false").optional(),
  }),
  candidateByEmail: Joi.object({
    email: emailPattern,
  }),
};
