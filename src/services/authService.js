import AsyncStorage from '@react-native-async-storage/async-storage';

const USER_STORAGE_KEY = '@instadownloader_user_profile';
const TOKEN_STORAGE_KEY = '@instadownloader_session_token';

export async function getStoredUser() {
  try {
    const json = await AsyncStorage.getItem(USER_STORAGE_KEY);
    return json ? JSON.parse(json) : null;
  } catch (e) {
    return null;
  }
}

export async function setStoredUser(user) {
  try {
    if (user) {
      await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
    } else {
      await AsyncStorage.removeItem(USER_STORAGE_KEY);
    }
  } catch (e) {}
}

export async function logoutUser() {
  try {
    await AsyncStorage.removeItem(USER_STORAGE_KEY);
    await AsyncStorage.removeItem(TOKEN_STORAGE_KEY);
  } catch (e) {}
}

export function checkIsPremium(user) {
  return false;
}
