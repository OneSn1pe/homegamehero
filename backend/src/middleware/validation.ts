import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { AppError } from './errorHandler';

export const validate = (schema: Joi.ObjectSchema) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    const validationOptions = {
      abortEarly: false,
      allowUnknown: false,
      stripUnknown: true,
    };

    // Combine all possible request data
    const dataToValidate = {
      ...req.body,
      ...req.query,
      ...req.params,
    };

    const { error, value } = schema.validate(dataToValidate, validationOptions);

    if (error) {
      const errorMessage = error.details
        .map((detail) => detail.message)
        .join(', ');
      return next(new AppError(`Validation error: ${errorMessage}`, 400));
    }

    // Replace request data with validated values
    req.body = value;
    Object.keys(req.params).forEach(key => {
      if (value[key] !== undefined) {
        req.params[key] = value[key];
      }
    });
    Object.keys(req.query).forEach(key => {
      if (value[key] !== undefined) {
        req.query[key] = value[key];
      }
    });

    next();
  };
};