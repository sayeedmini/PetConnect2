/**
 * groomerAvatar.js
 * Utility to manage and assign profile pictures to groomers.
 * Since most demo groomers don't have real uploaded photos, this provides 
 * high-quality Unsplash placeholders.
 */

// A pool of high-quality Unsplash images related to pet grooming
const UNSPLASH_GROOMER_AVATARS = [
  "https://images.unsplash.com/photo-1528846104175-4fd300ee59da?w=600&auto=format&fit=crop&q=60",
  "https://images.unsplash.com/photo-1625321171045-1fea4ac688e9?w=600&auto=format&fit=crop&q=60",
  "https://images.unsplash.com/photo-1582569522442-348f6ccfd85e?w=600&auto=format&fit=crop&q=60",
  "https://images.unsplash.com/photo-1715626000681-a0074b4d9783?w=600&auto=format&fit=crop&q=60",
  "https://images.unsplash.com/photo-1682194577027-f8f974f86140?w=600&auto=format&fit=crop&q=60",
  "https://images.unsplash.com/photo-1644675272883-0c4d582528d8?w=600&auto=format&fit=crop&q=60",
  "https://images.unsplash.com/photo-1700665537604-412e89a285c3?w=600&auto=format&fit=crop&q=60",
];

// Explicit mapping for our "Seed Data" groomers to keep their look consistent
const GROOMER_NAME_AVATAR_MAP = {
  "sarah's pet spa": UNSPLASH_GROOMER_AVATARS[0],
  "the bark butler": UNSPLASH_GROOMER_AVATARS[6],
  "paws & relax grooming": UNSPLASH_GROOMER_AVATARS[1],
  "dapper dog salon": UNSPLASH_GROOMER_AVATARS[2],
  "squeaky clean pets": UNSPLASH_GROOMER_AVATARS[3],
  "fluff & puff mobile": UNSPLASH_GROOMER_AVATARS[4],
  "luxury paw spa": UNSPLASH_GROOMER_AVATARS[5],
};

/**
 * Generates a stable numeric hash from a string.
 * Used to ensure the same groomer always gets the same default avatar.
 */
const stableHash = (text = "") => {
  let hash = 0;
  for (let i = 0; i < text.length; i += 1) {
    hash = (hash * 31 + text.charCodeAt(i)) >>> 0;
  }
  return hash;
};

/**
 * Primary function to get a groomer's profile picture.
 * Prioritizes real uploads, then specific maps, then hashed defaults.
 */
export const getGroomerAvatar = (groomer) => {
  if (!groomer) return UNSPLASH_GROOMER_AVATARS[0];

  // 1. Check for any real uploaded image fields in the database document
  const profileSrc =
    groomer.profilePicture ||
    groomer.profileImage ||
    groomer.avatar ||
    groomer.image ||
    groomer.photo ||
    groomer.photoUrl ||
    groomer?.user?.profilePicture ||
    groomer?.user?.avatar;

  if (profileSrc) return profileSrc;

  // 2. Check if the groomer name has a specific demo image assigned
  const groomerName = String(groomer.name || "").trim().toLowerCase();
  if (GROOMER_NAME_AVATAR_MAP[groomerName]) {
    return GROOMER_NAME_AVATAR_MAP[groomerName];
  }

  // 3. Fallback: Use the groomer's ID to pick a stable random image from the pool
  const key = String(groomer._id || groomer.id || groomer.name || "groomer");
  const index = stableHash(key) % UNSPLASH_GROOMER_AVATARS.length;
  return UNSPLASH_GROOMER_AVATARS[index];
};
