import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { generalLimiter } from "../middleware/rateLimit.middleware.js";
import { validateParams } from "../middleware/validation.middleware.js";
import Joi from "joi";

const router = Router();

// used this to test the timing on all the code with middlewares etc

/**
 * Direct API endpoint with authentication and rate limiting
 * GET /api/direct/department/:id
 * Returns department with all relations included
 */
router.get(
  "/department/:id",
  generalLimiter,
  authenticate,
  validateParams(Joi.object({ id: Joi.string().uuid().required() })),
  async (req, res, next) => {
    const startTime = performance.now();

    try {
      const { id } = req.params;

      // Get department with all relations
      const department = await prisma.department.findUnique({
        where: {
          DepartmentId: id,
        },
        include: {
          Positions: true,
          Hrs: {
            include: {
              Hr: {
                include: {
                  User: true,
                },
              },
            },
          },
        },
      });

      const endTime = performance.now();
      const duration = endTime - startTime;

      if (!department) {
        return res.status(404).json({
          success: false,
          message: `Department with id ${id} not found`,
          timer: `${duration.toFixed(2)}ms`,
        });
      }

      res.status(200).json({
        success: true,
        data: department,
        timer: `${duration.toFixed(2)}ms`,
      });
    } catch (error) {
      const endTime = performance.now();
      const duration = endTime - startTime;

      res.status(500).json({
        success: false,
        message: error.message || "Internal server error",
        timer: `${duration.toFixed(2)}ms`,
      });
    }
  },
);

export default router;
