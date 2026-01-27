import {
  createReferral,
  confirmReferral,
  deleteCandidate,
  getEmployeeReferrals,
  editCandidate,
} from "../services/employee/employee.service.js";

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

export const getApplicationsByEmployee = async (req, res, next) => {
  try {
    const employeeId = req.user.Employee?.EmployeeId;
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const search = req.query.search || "";

    const statusQuery = req.query.status;
    let status;

    if (statusQuery) {
      const allowedStatus = [
        "Pending",
        "Confirmed",
        "InterviewOne",
        "InterviewTwo",
        "Acceptance",
      ];

      if (!allowedStatus.includes(statusQuery)) {
        const error = new Error("Invalid status value");
        error.statusCode = 400;
        throw error;
      }

      status = statusQuery; 
    }

    const createdAt = req.query.createdAt || undefined;
    if (!employeeId) {
      const error = new Error("Employee profile not found");
      error.statusCode = 404;
      throw error;
    }
    const result = await getEmployeeReferrals({
      employeeId,
      page,
      pageSize,
      search,
      status,
      createdAt,
    });
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const EditCandidate = async (req, res, next) => {
  try {
    if (req.fileValidationError) {
      const error = new Error(req.fileValidationError);
      error.statusCode = 400;
      throw error;
    }
    const employeeId = req.user.Employee?.EmployeeId;
    const { candidateId } = req.params;

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
    } = req.body;

    const cvFile = req.file?.buffer;

    const payload = {
      candidateId,
      employeeId,
      candidateFirstName,
      candidateLastName,
      candidateEmail,
      candidateYearOfExperience,
      cvFile,
    };

    const result = await editCandidate(payload);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
