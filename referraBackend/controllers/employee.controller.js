import { createReferral, confirmReferral, deleteCandidate } from "../services/employee/employee.service.js";

// controllers for employee related operations
// business logic is in services

export const CreateReferral = async (req, res, next) => {
  try {
    if (req.fileValidationError) {
      const error = new Error(req.fileValidationError);
      error.statusCode = 400;
      throw error;
    }

    const employeeId = req.user.Employee?.EmployeeId;

    if (!employeeId) {
      const error = new Error("Employee profile not found");
      error.statusCode = 404;
      throw error;
    }

    const {
      candidateFirstName,
      candidateLastName,
      candidateEmail,
      candidateYearOfExperience,
      positionId,
    } = req.body;

    const cvFile = req.file?.buffer;

    if (!cvFile) {
      const error = new Error("CV file is required");
      error.statusCode = 400;
      throw error;
    } 

    const payload = {
      candidateFirstName,
      candidateLastName,
      candidateEmail,
      candidateYearOfExperience,
      positionId,
      employeeId,
      cvFile,
    };

    const result = await createReferral(payload);

    res.status(201).json({
      message: "Referral created successfully",
      application: result,
    });
  } catch (error) {
    next(error);
  }
};

export const ConfirmReferral = async (req, res, next) => {
  try {
    const { referralId } = req.params;
    const result = await confirmReferral(referralId);

    res.status(200).json({
      message: "Referral confirmed successfully",
      referral: result,
    });
  } catch (error) {
    next(error);
  }
};

export const DeleteCandidate = async (req, res, next) => {
  try {
    const employeeId = req.user.Employee?.EmployeeId;

    if (!employeeId) {
      const error = new Error("Employee profile not found");
      error.statusCode = 404;
      throw error;
    }

    const { candidateId } = req.params;

    if (!candidateId) {
      const error = new Error("Candidate ID is required");
      error.statusCode = 400;
      throw error;
    }

    const result = await deleteCandidate(candidateId, employeeId);

    res.status(200).json({
      message: result.message,
      deletedCandidate: result.deletedCandidate,
    });
  } catch (error) {
    next(error);
  }
};