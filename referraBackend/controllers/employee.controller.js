import {
  getVisiblePositions,
  getPositionDetails,
} from "../services/employee/employeePositions.service.js";
import {
  createReferral,
  confirmReferral,
  deleteCandidate,
  getEmployeeReferrals,
  editCandidate,
  getEmployeeReferralDetails,
  findCandidateByEmail,
} from "../services/employee/employeeReferrals.service.js";

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
      candidatePhoneNumber,
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
      candidatePhoneNumber,
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

    const { referralId } = req.params;

    if (!referralId) {
      const error = new Error("Referral ID is required");
      error.statusCode = 400;
      throw error;
    }

    // Get access token from cookies for authenticated Supabase operations
    const accessToken = req.cookies?.accessToken;

    const result = await deleteCandidate(referralId, employeeId, accessToken);

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
      candidatePhoneNumber,
      candidateYearOfExperience,
    } = req.body;

    const cvFile = req.file?.buffer;

    const payload = {
      candidateId,
      employeeId,
      candidateFirstName,
      candidateLastName,
      candidateEmail,
      candidatePhoneNumber,
      candidateYearOfExperience,
      cvFile,
    };

    const result = await editCandidate(payload);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const GetReferralDetails = async (req, res, next) => {
  try {
    const employeeId = req.user.Employee?.EmployeeId;
    const { referralId } = req.params;

    if (!employeeId) {
      const error = new Error("Employee profile not found");
      error.statusCode = 404;
      throw error;
    }

    const result = await getEmployeeReferralDetails({
      employeeId,
      referralId,
    });

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const GetVisiblePositions = async (req, res, next) => {
  try {
    const result = await getVisiblePositions(req.user, req.query);

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const GetPositionDetails = async (req, res, next) => {
  try {
    const { positionId } = req.params;
    const result = await getPositionDetails(req.user, positionId);

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const CheckCandidateByEmail = async (req, res) => {
  try {
    const { email } = req.query;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const candidate = await findCandidateByEmail(email.trim());

    if (!candidate) {
      return res.json({ exists: false });
    }

    return res.json({
      exists: true,
      candidate,
    });
  } catch (err) {
    console.error("CheckCandidateByEmail error:", err);
    res.status(500).json({ message: "Failed to check candidate" });
  }
};
