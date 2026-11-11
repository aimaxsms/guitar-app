const MY_SONGS_KEY = 'guitarApp_mySongs';

function getMySongs() {
  try {
    const raw = localStorage.getItem(MY_SONGS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    return [];
  }
}

function saveMySongs(songs) {
  try {
    localStorage.setItem(MY_SONGS_KEY, JSON.stringify(songs));
  } catch (err) {
    // localStorage unavailable (private browsing etc.) - fail silently, nothing to save to
  }
}

function addMySong(song) {
  const songs = getMySongs();
  const withId = { ...song, id: 'my-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8) };
  songs.push(withId);
  saveMySongs(songs);
  return withId;
}

function updateMySong(id, updates) {
  const songs = getMySongs();
  const index = songs.findIndex((s) => s.id === id);
  if (index !== -1) {
    songs[index] = { ...songs[index], ...updates };
    saveMySongs(songs);
  }
}

function deleteMySong(id) {
  saveMySongs(getMySongs().filter((s) => s.id !== id));
}
