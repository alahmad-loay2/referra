const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5500/api";

export const getVisiblePositions = async () => {
  try {
    const res = await fetch(`${API_BASE_URL}/employee/positions-employee`, {
      method: "GET",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(errorText || "Failed to fetch positions");
    }

    return await res.json();
  } catch (error) {
    return { error: error.message };
  }
};

export const fetchVisiblePositions = async ({ page = 1, pageSize = 3 }) => {
  try {
    const res = await fetch(
      `${API_BASE_URL}/employee/positions-employee?page=${page}&limit=${pageSize}`,
      {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(errorText || "Failed to fetch positions");
    }

    return await res.json();
  } catch (error) {
    return { error: error.message };
  }
};

export const getPositionDetails = async (positionId) => {
  try {
    const res = await fetch(
      `${API_BASE_URL}/employee/positions-employee/${positionId}`,
      {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(errorText || "Failed to fetch position details");
    }

    return await res.json();
  } catch (error) {
    return { error: error.message };
  }
};
