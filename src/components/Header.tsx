import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import supabase from "../config/supabaseClient";
import NoProfile from "../assets/no-profile.png";
import "./Header.css";

function Header({ user, isMenuOpen, setIsMenuOpen }: { user: any; isMenuOpen: boolean; setIsMenuOpen: (isOpen: boolean) => void }) {
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [profilePicture, setProfilePicture] = useState<string | null>(null);

  const navigate = useNavigate();

  // Fetch profile picture on component mount
  useEffect(() => {
    if (user) {
      fetchProfilePicture();
    }
  }, [user]);

  const fetchProfilePicture = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from("profiles")
      .select("profile_picture")
      .eq("profile_id", user.id)
      .single();

    if (error) {
      console.error("Error fetching profile picture:", error);
      return;
    }

    if (data && data.profile_picture) {
      setProfilePicture(data.profile_picture);
    }
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleLogout = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent event from bubbling up
    if (!user) return;
    
    setIsMenuOpen(false); // Close menu immediately
    
    const { error: isOnlineError } = await supabase
      .from("profiles")
      .update({ is_online: false, last_seen: new Date().toISOString() })
      .eq("profile_id", user.id);
   
    if (isOnlineError) {
      console.error("Error setting online status:", isOnlineError);
    }
 
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Error logging out:", error.message);
    } else {
      console.log("Logged out successfully!");
      navigate("/signin");
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Validate file is an image
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Optional: Check file size (e.g., max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }

    setUploading(true);

    try {
      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `profile-pictures/${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from("images")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("images")
        .getPublicUrl(filePath);

      const publicUrl = urlData.publicUrl;

      // Update profile in database
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ profile_picture: publicUrl })
        .eq("profile_id", user.id);

      if (updateError) {
        console.error('Update error details:', updateError);
        throw updateError;
      }

      // Update local state
      setProfilePicture(publicUrl);
      setShowUploadModal(false);
      alert('Profile picture updated successfully!');

    } catch (error: any) {
      console.error('Error uploading profile picture:', error);
      alert('Failed to upload profile picture: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const openUploadModal = () => {
    setShowUploadModal(true);
    setIsMenuOpen(false);
  };

  return (
    <>
      <div className="header">
        <h1 className="logo">TechTalk</h1>
        <div onClick={toggleMenu}>
          <img 
            src={profilePicture || NoProfile} 
            className="profile-menu"
            alt="Profile"
          />
        </div>
        {isMenuOpen && (
          <div className="dropdown-menu" onClick={(e) => e.stopPropagation()}>
            <button onClick={openUploadModal}>Change profile</button>
            <div className="logout-section" onClick={handleLogout}>
              <p>Logout</p>
              <i className="bi bi-box-arrow-right"></i>
            </div>
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="modal-overlay" onClick={() => setShowUploadModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Upload Profile Picture</h2>
            <div className="modal-body">
              {profilePicture && (
                <div className="current-picture">
                  <p>Current Picture:</p>
                  <img src={profilePicture} alt="Current profile" style={{ width: '150px', height: '150px', objectFit: 'cover', borderRadius: '50%' }} />
                </div>
              )}
              <label htmlFor="file-upload" className="file-upload-label">
                {uploading ? 'Uploading...' : 'Choose Image'}
              </label>
              <input
                id="file-upload"
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                disabled={uploading}
                style={{ display: 'none' }}
              />
              <p className="file-note">Max size: 5MB | Formats: JPG, PNG, GIF</p>
            </div>
            <div className="modal-actions">
              <button 
                onClick={() => setShowUploadModal(false)} 
                disabled={uploading}
                className="cancel-btn"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Header;