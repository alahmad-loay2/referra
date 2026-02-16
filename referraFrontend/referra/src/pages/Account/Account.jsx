import React, { useEffect, useState, useRef, useCallback } from "react";
import Cropper from "react-easy-crop";
import "./Account.css";
import {
  getUserInfo,
  updateUserInfo,
  updateProfilePicture,
} from "../../api/user.api.js";
import Loading from "../../components/loading/Loading.jsx";
import { useUserStore } from "../../store/userStore.js";
import NormalSelect from "../../components/normalSelect/NormalSelect";
// account page where users can view and edit their profile information, including their profile picture,
// personal details, and work information. It also allows employees to see their total compensation.
//  The page includes modals for confirming cancel/save actions and for cropping the profile picture when updating it.
const Account = () => {
  const [profileData, setProfileData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditMode, setIsEditMode] = useState(false);
  const [formData, setFormData] = useState({});
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [updateError, setUpdateError] = useState("");
  const [updateSuccess, setUpdateSuccess] = useState("");
  const [showAvatarMenu, setShowAvatarMenu] = useState(false);
  const [showViewPP, setShowViewPP] = useState(false);
  const [isUploadingPP, setIsUploadingPP] = useState(false);
  const [showCropModal, setShowCropModal] = useState(false);
  const [imageSrc, setImageSrc] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const fileInputRef = useRef(null);
  const setFirstName = useUserStore((state) => state.setFirstName);

  const fetchProfileData = async () => {
    try {
      setIsLoading(true);
      const data = await getUserInfo();
      setProfileData(data);
      // Update Zustand store with firstName
      if (data?.FirstName) {
        setFirstName(data.FirstName);
      }
    } catch (error) {
      console.error("Failed to fetch profile data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileData();
  }, []);

  // Close avatar menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        showAvatarMenu &&
        !event.target.closest(".accountContentLeftAvatarContainer")
      ) {
        setShowAvatarMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showAvatarMenu]);

  // Initialize form data when entering edit mode
  useEffect(() => {
    if (isEditMode && profileData) {
      setFormData({
        firstName: profileData.FirstName || "",
        lastName: profileData.LastName || "",
        age: profileData.Age || "",
        phoneNumber: profileData.PhoneNumber || "",
        gender: profileData.Gender || "",
        department:
          profileData.Role === "Employee"
            ? profileData.Employee?.Department || ""
            : "",
        position:
          profileData.Role === "Employee"
            ? profileData.Employee?.Position || ""
            : "",
      });
    }
  }, [isEditMode, profileData]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleEditClick = () => {
    setIsEditMode(true);
    setUpdateError("");
    setUpdateSuccess("");
  };

  const handleCancelClick = () => {
    setShowCancelConfirm(true);
  };

  const confirmCancel = () => {
    setIsCancelling(true);
    setIsEditMode(false);
    setShowCancelConfirm(false);
    setFormData({});
    setUpdateError("");
    setUpdateSuccess("");
    setTimeout(() => setIsCancelling(false), 300);
  };

  const handleSaveClick = () => {
    setShowSaveConfirm(true);
  };

  const confirmSave = async () => {
    try {
      setIsSaving(true);
      setUpdateError("");
      setUpdateSuccess("");
      // Remove department and position for HR users only - they're not allowed in the schema
      const payloadToSend =
        profileData?.Role === "HR"
          ? (() => {
              const { department, position, ...rest } = formData;
              return rest;
            })()
          : formData;
      const updatedData = await updateUserInfo(payloadToSend);
      setProfileData(updatedData);
      // Update Zustand store with new firstName if it was changed
      if (updatedData?.FirstName) {
        setFirstName(updatedData.FirstName);
      }
      setIsEditMode(false);
      setShowSaveConfirm(false);
      setUpdateSuccess("Profile updated successfully!");
      setTimeout(() => setUpdateSuccess(""), 3000);
    } catch (error) {
      setUpdateError(error.message || "Failed to update profile");
      setShowSaveConfirm(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateProfile = async (payload) => {
    try {
      await updateUserInfo(payload);
    } catch (error) {
      console.error("Failed to update profile:", error);
    }
  };

  // Get avatar initials
  const getAvatarInitials = () => {
    if (!profileData) return "";
    const firstInitial = profileData.FirstName?.[0]?.toUpperCase() || "";
    const lastInitial = profileData.LastName?.[0]?.toUpperCase() || "";
    return firstInitial + lastInitial;
  };

  // Handle avatar click
  const handleAvatarClick = () => {
    setShowAvatarMenu(!showAvatarMenu);
  };

  // Handle view profile picture
  const handleViewPP = () => {
    setShowViewPP(true);
    setShowAvatarMenu(false);
  };

  // Handle edit profile picture
  const handleEditPP = () => {
    fileInputRef.current?.click();
    setShowAvatarMenu(false);
  };

  // Handle file selection - show crop modal
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setUpdateError("Please select an image file");
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setUpdateError("Image size must be less than 5MB");
      return;
    }

    // Read file and show crop modal
    const reader = new FileReader();
    reader.addEventListener("load", () => {
      setImageSrc(reader.result);
      setShowCropModal(true);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
    });
    reader.readAsDataURL(file);
  };

  // Handle crop completion
  const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  // Create cropped image blob
  const createImage = (url) =>
    new Promise((resolve, reject) => {
      const image = new Image();
      image.addEventListener("load", () => resolve(image));
      image.addEventListener("error", (error) => reject(error));
      image.src = url;
    });

  const getCroppedImg = async (imageSrc, pixelCrop) => {
    const image = await createImage(imageSrc);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    // Set canvas size to crop size
    const size = Math.min(pixelCrop.width, pixelCrop.height);
    canvas.width = size;
    canvas.height = size;

    // Create circular clipping path
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2, 0, 2 * Math.PI);
    ctx.clip();

    // Calculate scale to fit the crop area
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    // Draw the cropped image
    ctx.drawImage(
      image,
      pixelCrop.x * scaleX,
      pixelCrop.y * scaleY,
      pixelCrop.width * scaleX,
      pixelCrop.height * scaleY,
      0,
      0,
      size,
      size,
    );

    return new Promise((resolve) => {
      canvas.toBlob(
        (blob) => {
          resolve(blob);
        },
        "image/jpeg",
        0.9,
      );
    });
  };

  // Handle crop and upload
  const handleCropAndUpload = async () => {
    if (!imageSrc || !croppedAreaPixels) return;

    try {
      setIsUploadingPP(true);
      setUpdateError("");
      setUpdateSuccess("");

      const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels);
      const file = new File([croppedImage], "profile-picture.jpg", {
        type: "image/jpeg",
      });

      const updatedData = await updateProfilePicture(file);
      setProfileData(updatedData);
      setUpdateSuccess("Profile picture updated successfully!");

      // Close crop modal
      setShowCropModal(false);
      setImageSrc(null);

      // Refresh profile data to ensure sidebar gets updated
      await fetchProfileData();

      // Dispatch custom event to refresh sidebar
      window.dispatchEvent(new CustomEvent("profilePictureUpdated"));

      setTimeout(() => setUpdateSuccess(""), 3000);
    } catch (error) {
      setUpdateError(error.message || "Failed to update profile picture");
    } finally {
      setIsUploadingPP(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // Handle cancel crop
  const handleCancelCrop = () => {
    setShowCropModal(false);
    setImageSrc(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Close view PP modal
  const handleCloseViewPP = () => {
    setShowViewPP(false);
  };

  // Get full name
  const getFullName = () => {
    if (!profileData) return "";
    return `${profileData.FirstName || ""} ${profileData.LastName || ""}`.trim();
  };

  // Get position
  const getPosition = () => {
    if (!profileData) return "";
    if (profileData.Role === "HR") {
      return "HR";
    }
    return profileData.Employee?.Position || "";
  };

  // Get department
  const getDepartment = () => {
    if (!profileData) return "";
    if (profileData.Role === "HR") {
      // Get first department from HR departments
      const firstDepartment =
        profileData.Hr?.Departments?.[0]?.Department?.DepartmentName;
      return firstDepartment || "";
    }
    return profileData.Employee?.Department || "";
  };

  // Get total compensation (for employees and HR users who have Employee records)
  const getTotalCompensation = () => {
    if (!profileData || !profileData.Employee) return null;
    return profileData.Employee?.TotalCompensation || 0;
  };

  if (isLoading) {
    return <Loading />;
  }

  return (
    <div className="account">
      <h3>My Profile</h3>
      <p>Manage your personal information and view your referral stats.</p>
      <div className="accountContent">
        <div className="accountContentLeft">
          {profileData && (
            <>
              <div className="accountContentLeftAvatarContainer">
                <div
                  className="accountContentLeftAvatar"
                  onClick={handleAvatarClick}
                  style={{ cursor: "pointer", position: "relative" }}
                >
                  {isUploadingPP && (
                    <div className="accountContentLeftAvatarLoading">
                      <span>...</span>
                    </div>
                  )}
                  {profileData.ProfileUrl ? (
                    <img
                      src={profileData.ProfileUrl}
                      alt="Profile"
                      className="accountContentLeftAvatarImage"
                      style={{ opacity: isUploadingPP ? 0.5 : 1 }}
                    />
                  ) : (
                    <span style={{ opacity: isUploadingPP ? 0.5 : 1 }}>
                      {getAvatarInitials()}
                    </span>
                  )}
                </div>
                {showAvatarMenu && (
                  <div className="accountAvatarMenu">
                    <button
                      className="accountAvatarMenuItem"
                      onClick={handleViewPP}
                      disabled={!profileData.ProfileUrl}
                    >
                      View PP
                    </button>
                    <button
                      className="accountAvatarMenuItem"
                      onClick={handleEditPP}
                      disabled={isUploadingPP}
                    >
                      {isUploadingPP ? "Uploading..." : "Edit PP"}
                    </button>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={handleFileChange}
                />
              </div>
              <div className="accountContentLeftInfo">
                <h4>{getFullName()}</h4>
                <p>{getPosition()}</p>
                <span>{getDepartment()}</span>
              </div>
            </>
          )}
        </div>
        {profileData &&
          profileData.Employee &&
          getTotalCompensation() !== null && (
            <div className="accountContentCenter">
              <div className="accountContentCenterLabel">
                Total Compensation
              </div>
              <div className="accountContentCenterAmount">
                ${getTotalCompensation().toLocaleString()}
              </div>
            </div>
          )}
        <div className="accountContentRight">
          {!isEditMode ? (
            <button
              className="accountContentRightButton"
              onClick={handleEditClick}
            >
              Edit Profile
            </button>
          ) : (
            <div className="accountContentRightActions">
              <button
                className="accountContentRightCancel"
                onClick={handleCancelClick}
                disabled={isSaving || isCancelling}
              >
                Cancel
              </button>
              <button
                className="accountContentRightSave"
                onClick={handleSaveClick}
                disabled={isSaving || isCancelling}
              >
                {isSaving ? "Saving..." : "Save"}
              </button>
            </div>
          )}
        </div>
      </div>

      {profileData && (
        <>
          <div className="personalInformation">
            <h3>Personal Information</h3>
            <p>Your basic personal and contact details.</p>
            <div className="personalInformationContent">
              <div className="personalInformationRow">
                <div className="personalInformationContentItem">
                  <h4>First Name</h4>
                  {isEditMode ? (
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName || ""}
                      onChange={handleInputChange}
                      className="accountInput"
                    />
                  ) : (
                    <p>{profileData.FirstName}</p>
                  )}
                </div>
                <div className="personalInformationContentItem">
                  <h4>Last Name</h4>
                  {isEditMode ? (
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName || ""}
                      onChange={handleInputChange}
                      className="accountInput"
                    />
                  ) : (
                    <p>{profileData.LastName}</p>
                  )}
                </div>
              </div>

              <div className="personalInformationRow">
                <div className="personalInformationContentItem">
                  <h4>Email</h4>
                  <p>{profileData.Email}</p>
                </div>
                <div className="personalInformationContentItem">
                  <h4>Age</h4>
                  {isEditMode ? (
                    <input
                      type="number"
                      name="age"
                      value={formData.age || ""}
                      onChange={handleInputChange}
                      className="accountInput"
                    />
                  ) : (
                    <p>{profileData.Age}</p>
                  )}
                </div>
              </div>

              <div className="personalInformationRow">
                <div className="personalInformationContentItem">
                  <h4>Phone</h4>
                  {isEditMode ? (
                    <input
                      type="text"
                      name="phoneNumber"
                      value={formData.phoneNumber || ""}
                      onChange={handleInputChange}
                      className="accountInput"
                    />
                  ) : (
                    <p>{profileData.PhoneNumber}</p>
                  )}
                </div>
                <div className="personalInformationContentItem personalInformationContentItemGender">
                  <h4>Gender</h4>
                  {isEditMode ? (
                    <NormalSelect
                      name="gender"
                      value={formData.gender || ""}
                      onChange={(val) =>
                        setFormData((prev) => ({ ...prev, gender: val }))
                      }
                      options={[
                        { value: "Male", label: "Male" },
                        { value: "Female", label: "Female" },
                        { value: "Other", label: "Other" },
                      ]}
                      placeholder="Select gender"
                    />
                  ) : (
                    <p>{profileData.Gender}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="workInformation">
            <h3>Work Information</h3>
            <p>Your employment details at Aspire.</p>
            <div className="workInformationContent">
              {profileData.Role === "Employee" && (
                <>
                  <div className="workInformationContentItem">
                    <h4>Department</h4>
                    {isEditMode ? (
                      <input
                        type="text"
                        name="department"
                        value={formData.department || ""}
                        onChange={handleInputChange}
                        className="accountInput"
                      />
                    ) : (
                      <p>{getDepartment()}</p>
                    )}
                  </div>
                  <div className="workInformationContentItem">
                    <h4>Position</h4>
                    {isEditMode ? (
                      <input
                        type="text"
                        name="position"
                        value={formData.position || ""}
                        onChange={handleInputChange}
                        className="accountInput"
                      />
                    ) : (
                      <p>{getPosition()}</p>
                    )}
                  </div>
                </>
              )}
              {profileData.Role === "HR" && (
                <>
                  <div className="workInformationContentItem">
                    <h4>Department</h4>
                    <p>{getDepartment()}</p>
                  </div>
                  <div className="workInformationContentItem">
                    <h4>Position</h4>
                    <p>{getPosition()}</p>
                  </div>
                </>
              )}
              <div className="workInformationContentItem">
                <h4>Join Date</h4>
                {profileData.CreatedAt ? (
                  <p>
                    {new Date(profileData.CreatedAt).toLocaleDateString(
                      "en-CA",
                      { year: "numeric", month: "2-digit", day: "2-digit" },
                    )}
                  </p>
                ) : (
                  <p>N/A</p>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Cancel Confirmation Modal */}
      {showCancelConfirm && (
        <div className="account-modalOverlay">
          <div className="account-modal">
            <h3>Cancel editing?</h3>
            <p>
              Are you sure you want to cancel? All unsaved changes will be lost.
            </p>
            <div className="account-modalActions">
              <button
                className="account-modalCancel"
                onClick={() => setShowCancelConfirm(false)}
                disabled={isCancelling}
              >
                No
              </button>
              <button
                className="account-modalConfirm"
                onClick={confirmCancel}
                disabled={isCancelling}
              >
                {isCancelling ? "Cancelling..." : "Yes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Save Confirmation Modal */}
      {showSaveConfirm && (
        <div className="account-modalOverlay">
          <div className="account-modal">
            <h3>Save changes?</h3>
            <p>Are you sure you want to save these changes?</p>
            <div className="account-modalActions">
              <button
                className="account-modalCancel"
                onClick={() => setShowSaveConfirm(false)}
                disabled={isSaving}
              >
                Cancel
              </button>
              <button
                className="account-modalConfirm"
                onClick={confirmSave}
                disabled={isSaving}
              >
                {isSaving ? "Saving..." : "Yes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Crop Modal */}
      {showCropModal && imageSrc && (
        <div className="account-modalOverlay">
          <div
            className="account-cropModal"
            onClick={(e) => e.stopPropagation()}
          >
            <h3>Crop Your Profile Picture</h3>
            <div className="account-cropContainer">
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={1}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
                cropShape="round"
                showGrid={false}
              />
            </div>
            <div className="account-cropControls">
              <label className="account-cropZoomLabel">
                Zoom: {zoom.toFixed(2)}x
                <input
                  type="range"
                  value={zoom}
                  min={1}
                  max={3}
                  step={0.1}
                  onChange={(e) => setZoom(parseFloat(e.target.value))}
                  className="account-cropZoomSlider"
                />
              </label>
            </div>
            <div className="account-cropActions">
              <button
                className="account-modalCancel"
                onClick={handleCancelCrop}
                disabled={isUploadingPP}
              >
                Cancel
              </button>
              <button
                className="account-modalConfirm"
                onClick={handleCropAndUpload}
                disabled={isUploadingPP}
              >
                {isUploadingPP ? "Uploading..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Profile Picture Modal */}
      {showViewPP && profileData?.ProfileUrl && (
        <div className="account-modalOverlay" onClick={handleCloseViewPP}>
          <div
            className="account-viewPPModal"
            onClick={(e) => e.stopPropagation()}
          >
            <button className="account-viewPPClose" onClick={handleCloseViewPP}>
              ×
            </button>
            <img
              src={profileData.ProfileUrl}
              alt="Profile Picture"
              className="account-viewPPImage"
            />
          </div>
        </div>
      )}

      {/* Success/Error Messages */}
      {updateSuccess && (
        <div className="account-feedback success">{updateSuccess}</div>
      )}
      {updateError && (
        <div className="account-feedback error">{updateError}</div>
      )}
    </div>
  );
};

export default Account;
