// Ghanaian Nicknames API - Backend Storage System
// This system fetches 100 names daily and stores them in backend storage
// After 24 hours, removes previous names and fetches 100 new ones

// Backend storage simulation (in real app, this would be a database)
let backendStorage = {
  currentNames: [],
  lastFetch: null,
  expiryTime: null,
  dailyLimit: 100
};

// Backend API endpoints (simulated)
const BACKEND_ENDPOINTS = {
  STORE_NAMES: 'https://api.example.com/names/store',
  GET_NAMES: 'https://api.example.com/names/get',
  CLEAR_NAMES: 'https://api.example.com/names/clear',
  CHECK_EXPIRY: 'https://api.example.com/names/expiry'
};

// Fallback Ghanaian nicknames in case all APIs fail
const fallbackNicknames = [
  "Kwame", "Kofi", "Kwaku", "Kwabena", "Yaw", "Fiifi", "Kojo", "Kweku",
  "Akosua", "Adwoa", "Abenaa", "Akua", "Yaa", "Afua", "Ama", "Efua",
  "Nana", "Osei", "Asante", "Adjei", "Mensah", "Owusu", "Boateng",
  "Acheampong", "Appiah", "Asiedu", "Bonsu", "Darko", "Frimpong",
  "Gyasi", "Kwarteng", "Ofori", "Opoku", "Sarpong", "Tetteh",
  "Agyeman", "Amoah", "Antwi", "Asamoah", "Baffour", "Dankwa",
  "Fosu", "Gyamfi", "Hagan", "Koranteng", "Mintah", "Nkansah",
  "Poku", "Quansah", "Ussher", "Vandyck", "Wiafe", "Yeboah", "Zakari"
];

// Backend storage functions
const storeNamesInBackend = async (names) => {
  try {
    console.log(`📦 Storing ${names.length} names in backend...`);
    
    // Simulate backend storage
    backendStorage.currentNames = [...names];
    backendStorage.lastFetch = Date.now();
    backendStorage.expiryTime = Date.now() + (24 * 60 * 60 * 1000); // 24 hours from now
    
    // In a real app, this would be an API call:
    // const response = await fetch(BACKEND_ENDPOINTS.STORE_NAMES, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ names, expiryTime: backendStorage.expiryTime })
    // });
    
    console.log(`✅ Successfully stored ${names.length} names in backend`);
    console.log(`⏰ Names will expire at: ${new Date(backendStorage.expiryTime).toLocaleString()}`);
    return true;
  } catch (error) {
    console.error("❌ Error storing names in backend:", error);
    return false;
  }
};

const getNamesFromBackend = async () => {
  try {
    console.log("📥 Retrieving names from backend...");
    
    // Check if names have expired
    if (backendStorage.expiryTime && Date.now() > backendStorage.expiryTime) {
      console.log("⏰ Names have expired, need to fetch new ones");
      return null;
    }
    
    // In a real app, this would be an API call:
    // const response = await fetch(BACKEND_ENDPOINTS.GET_NAMES);
    // const data = await response.json();
    // return data.names;
    
    if (backendStorage.currentNames.length > 0) {
      console.log(`✅ Retrieved ${backendStorage.currentNames.length} names from backend`);
      return backendStorage.currentNames;
    }
    
    return null;
  } catch (error) {
    console.error("❌ Error retrieving names from backend:", error);
    return null;
  }
};

const clearBackendNames = async () => {
  try {
    console.log("🗑️ Clearing previous names from backend...");
    
    // In a real app, this would be an API call:
    // await fetch(BACKEND_ENDPOINTS.CLEAR_NAMES, { method: 'DELETE' });
    
    backendStorage.currentNames = [];
    backendStorage.lastFetch = null;
    backendStorage.expiryTime = null;
    
    console.log("✅ Backend names cleared successfully");
    return true;
  } catch (error) {
    console.error("❌ Error clearing backend names:", error);
    return false;
  }
};

// Check if backend names are still valid
const isBackendDataValid = () => {
  if (!backendStorage.expiryTime) return false;
  return Date.now() < backendStorage.expiryTime;
};

// API Sources for Ghanaian names/nicknames
const apiSources = [
  {
    name: "Random User API (Ghana)",
    url: "https://randomuser.me/api/?nat=gh&results=20",
    parser: (data) => {
      const names = [];
      if (data.results) {
        data.results.forEach(user => {
          names.push(user.name.first);
          names.push(user.name.last);
        });
      }
      return names;
    }
  },
  {
    name: "Name Fake API",
    url: "https://api.namefake.com/ghana/",
    parser: (data) => {
      const names = [];
      if (data.name) {
        const nameParts = data.name.split(' ');
        names.push(...nameParts);
      }
      return names;
    }
  },
  {
    name: "Random Data API",
    url: "https://random-data-api.com/api/name/random_name?size=20",
    parser: (data) => {
      const names = [];
      if (Array.isArray(data)) {
        data.forEach(item => {
          if (item.first_name) names.push(item.first_name);
          if (item.last_name) names.push(item.last_name);
        });
      }
      return names;
    }
  },
  {
    name: "JSON Placeholder Names",
    url: "https://jsonplaceholder.typicode.com/users",
    parser: (data) => {
      const names = [];
      if (Array.isArray(data)) {
        data.forEach(user => {
          if (user.name) {
            const nameParts = user.name.split(' ');
            names.push(...nameParts);
          }
        });
      }
      return names;
    }
  },
  {
    name: "UINames API",
    url: "https://uinames.com/api/?region=ghana&amount=20",
    parser: (data) => {
      const names = [];
      if (Array.isArray(data)) {
        data.forEach(item => {
          if (item.name) names.push(item.name);
          if (item.surname) names.push(item.surname);
        });
      } else if (data.name) {
        names.push(data.name);
        if (data.surname) names.push(data.surname);
      }
      return names;
    }
  }
];

// Fetch names from a single API source
const fetchFromSource = async (source) => {
  try {
    console.log(`Fetching from ${source.name}...`);
    const response = await fetch(source.url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      timeout: 10000 // 10 second timeout
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    const names = source.parser(data);
    
    console.log(`${source.name} returned ${names.length} names`);
    return names.filter(name => name && name.trim().length > 0);
  } catch (error) {
    console.log(`${source.name} failed:`, error.message);
    return [];
  }
};

// Fetch names from all API sources and store in backend
const fetchAndStoreNames = async () => {
  try {
    console.log(`🔄 Starting daily fetch of ${backendStorage.dailyLimit} Ghanaian nicknames...`);
    
    // Clear previous names from backend
    await clearBackendNames();
    
    // Fetch from all sources in parallel
    const promises = apiSources.map(source => fetchFromSource(source));
    const results = await Promise.allSettled(promises);
    
    let allNames = [];
    let successCount = 0;
    
    results.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value.length > 0) {
        allNames = [...allNames, ...result.value];
        successCount++;
        console.log(`✅ ${apiSources[index].name}: ${result.value.length} names`);
      } else {
        console.log(`❌ ${apiSources[index].name}: Failed`);
      }
    });
    
    // Remove duplicates and filter
    const uniqueNames = [...new Set(allNames)]
      .filter(name => name && name.trim().length > 0)
      .map(name => name.trim())
      .slice(0, backendStorage.dailyLimit); // Limit to 100 names
    
    if (uniqueNames.length > 0) {
      // Store in backend
      const stored = await storeNamesInBackend(uniqueNames);
      if (stored) {
        console.log(`🎉 Daily fetch complete: ${uniqueNames.length} names stored in backend`);
        console.log(`📅 Next fetch will be in 24 hours`);
        return true;
      }
    }
    
    console.log("❌ No names fetched from any source");
    return false;
  } catch (error) {
    console.error("Error fetching and storing names:", error);
    return false;
  }
};

// Get names from backend storage or fetch new ones
const getNames = async () => {
  console.log("🔍 getNames called");
  
  // Try to get names from backend first
  const backendNames = await getNamesFromBackend();
  console.log("🔍 Backend names result:", backendNames ? backendNames.length : "null");
  
  if (backendNames && backendNames.length > 0) {
    const timeUntilExpiry = Math.round((backendStorage.expiryTime - Date.now()) / (1000 * 60 * 60));
    console.log(`📥 Using backend names: ${backendNames.length} nicknames`);
    console.log(`⏰ Names expire in ${timeUntilExpiry} hours`);
    return backendNames;
  }

  // Backend is empty or expired, fetch and store new names
  console.log("🔄 Backend empty or expired, fetching fresh names...");
  const fetched = await fetchAndStoreNames();
  console.log("🔍 Fetch result:", fetched);
  
  // If fetch failed, use fallback
  if (!fetched) {
    console.log("Using fallback Ghanaian nicknames");
    return fallbackNicknames;
  }

  // Return the newly stored names
  console.log("🔍 Returning newly stored names:", backendStorage.currentNames.length);
  return backendStorage.currentNames;
};

// Generate a random Ghanaian nickname
export const generateGhanaianNickname = async () => {
  console.log("🎲 generateGhanaianNickname called");
  const names = await getNames();
  console.log("📋 Available names count:", names.length);
  console.log("📋 First 5 names:", names.slice(0, 5));
  
  if (!names || names.length === 0) {
    console.error("❌ No names available!");
    return "NoName";
  }
  
  const randomIndex = Math.floor(Math.random() * names.length);
  const randomName = names[randomIndex];
  console.log("🎯 Random index:", randomIndex);
  console.log("🎯 Generated nickname:", randomName);
  return randomName;
};

// Generate multiple Ghanaian nicknames
export const generateMultipleGhanaianNicknames = async (count = 10) => {
  const names = [];
  for (let i = 0; i < count; i++) {
    const name = await generateGhanaianNickname();
    names.push(name);
  }
  return names;
};

// Get a random nickname from cache (synchronous)
export const getRandomNickname = () => {
  if (nameCache.nicknames.length > 0) {
    return nameCache.nicknames[Math.floor(Math.random() * nameCache.nicknames.length)];
  }
  return fallbackNicknames[Math.floor(Math.random() * fallbackNicknames.length)];
};

// Force refresh names from all sources and store in backend
export const refreshNamesFromInternet = async () => {
  console.log("🔄 Force refreshing names from internet...");
  return await fetchAndStoreNames();
};

// Clear backend storage and fetch fresh names
export const clearAndRefreshBackend = async () => {
  console.log("🗑️ Clearing backend and fetching fresh names...");
  await clearBackendNames();
  return await fetchAndStoreNames();
};

// Get backend storage status
export const getBackendStatus = () => {
  const now = Date.now();
  const timeUntilExpiry = backendStorage.expiryTime ? 
    Math.round((backendStorage.expiryTime - now) / (1000 * 60 * 60)) : null;
  
  return {
    namesCount: backendStorage.currentNames.length,
    lastFetch: backendStorage.lastFetch,
    expiryTime: backendStorage.expiryTime,
    isExpired: backendStorage.expiryTime ? now > backendStorage.expiryTime : true,
    timeUntilExpiry: timeUntilExpiry,
    nextRefreshIn: timeUntilExpiry ? `${timeUntilExpiry} hours` : 'Expired',
    dailyLimit: backendStorage.dailyLimit
  };
};

// Get current backend names (for debugging)
export const getCurrentBackendNames = () => {
  return backendStorage.currentNames;
};

// Test all API sources
export const testAllSources = async () => {
  console.log("Testing all API sources...");
  const results = [];
  
  for (const source of apiSources) {
    const names = await fetchFromSource(source);
    results.push({
      source: source.name,
      success: names.length > 0,
      count: names.length,
      names: names.slice(0, 5) // First 5 names as sample
    });
  }
  
  return results;
};

// Export all functions
export default {
  generateGhanaianNickname,
  generateMultipleGhanaianNicknames,
  getRandomNickname,
  refreshNamesFromInternet,
  clearAndRefreshBackend,
  getBackendStatus,
  getCurrentBackendNames,
  testAllSources,
  getNames
};