import Joi from "joi";

const validate = (data, schema) => {
  const { error, value } = schema.validate(data);

  if (error) {
    const errorMessages = error.details.map((d) => d.message).join(", ");
    const err = new Error(`Validation error: ${errorMessages}`);
    err.statusCode = 400;
    throw err;
  }

  return value;
};

export const validateBody = (schema) => async (req, res, next) => {
  try {
    req.body = validate(req.body, schema);
    next();
  } catch (error) {
    next(error);
  }
};

export const validateParams = (schema) => async (req, res, next) => {
  try {
    req.params = validate(req.params, schema);
    next();
  } catch (error) {
    next(error);
  }
};
