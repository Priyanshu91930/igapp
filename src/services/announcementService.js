export async function fetchAllAnnouncements() {
  return [];
}

export async function fetchLatestAnnouncement() {
  return null;
}

export async function isAnnouncementDismissed(id) {
  return false;
}

export async function dismissAnnouncement(id) {
  return Promise.resolve();
}
