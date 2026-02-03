const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5500/api";

export const getHrDashboard = async () => {
  try {
    const res = await fetch(`${API_BASE_URL}/hr/dashboard`, {
      method: "GET",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.message || "Failed to get HR dashboard");
    }

    return await res.json();
  } catch (error) {
    console.error("getHrDashboard error:", error);
    throw error;
  }
};

export const getHrPositions = async ({
  page = 1,
  limit = 10,
  search = "",
  status = "",
  departmentId = "",
} = {}) => {
  const params = new URLSearchParams();

  params.append("page", page);
  params.append("limit", limit);

  if (search) params.append("search", search);
  if (status) params.append("status", status);
  if (departmentId) params.append("departmentId", departmentId);

  try {
    const res = await fetch(
      `${API_BASE_URL}/hr/positions-hr?${params.toString()}`,
      {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    return await res.json();
  } catch (error) {
    throw error;
  }
};



export const updatePositionState = async (positionId, state) => {
  try {
    const res = await fetch(
      `${API_BASE_URL}/hr/positions/${positionId}/state`,
      {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ state }),
      }
    );

    return await res.json();
  } catch (error) {
    throw error;
  }
};


export const createPosition = async (positionData) => {
  try {
    const res = await fetch(`${API_BASE_URL}/hr/positions`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(positionData),
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.message || "Failed to create position");
    }

    return await res.json();
  } catch (error) {
    console.error("createPosition error:", error);
    throw error;
  }
};

export const updatePosition = async (positionId, positionData) => {
  try {
    const res = await fetch(`${API_BASE_URL}/hr/positions/${positionId}`, {
      method: "PUT",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(positionData),
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.message || "Failed to update position");
    }

    return await res.json();
  } catch (error) {
    console.error("updatePosition error:", error);
    throw error;
  }
};

export const getPositionDetails = async (positionId) => {
  try {
    const res = await fetch(
      `${API_BASE_URL}/hr/positions-hr/${positionId}`,
      {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.message || "Failed to get position details");
    }

    return await res.json();
  } catch (error) {
    console.error("getPositionDetails error:", error);
    throw error;
  }
};

export const getHrDepartments = async () => {
  try {
    const res = await fetch(`${API_BASE_URL}/hr/departments-hr`, {
      method: "GET",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.message || "Failed to get departments");
    }

    return await res.json();
  } catch (error) {
    console.error("getHrDepartments error:", error);
    throw error;
  }
};