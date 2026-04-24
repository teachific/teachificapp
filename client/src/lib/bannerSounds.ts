// Banner sound definitions — kept in a separate non-component file to avoid HMR incompatibility
export const BANNER_SOUNDS = [
  { id: "none", label: "No sound", emoji: "🔇", url: "" },
  { id: "chime", label: "Chime", emoji: "🔔", url: "https://cdn.pixabay.com/audio/2022/03/15/audio_1b7e4d5e3e.mp3" },
  { id: "bell", label: "Bell", emoji: "🛎️", url: "https://cdn.pixabay.com/audio/2022/03/24/audio_c8c8a73467.mp3" },
  { id: "fanfare", label: "Fanfare", emoji: "🎺", url: "https://cdn.pixabay.com/audio/2021/08/04/audio_0625c1539c.mp3" },
  { id: "ding", label: "Ding", emoji: "✨", url: "https://cdn.pixabay.com/audio/2022/01/18/audio_d0c6ff1c23.mp3" },
  { id: "success", label: "Success", emoji: "🎉", url: "https://cdn.pixabay.com/audio/2021/08/09/audio_dc39bde808.mp3" },
  { id: "levelup", label: "Level Up", emoji: "⬆️", url: "https://cdn.pixabay.com/audio/2022/03/10/audio_270f49d8a6.mp3" },
  { id: "applause",  label: "Applause",   emoji: "👏", url: "https://cdn.pixabay.com/audio/2022/03/15/audio_c8c8a73467.mp3" },
  { id: "tada",      label: "Ta-da!",     emoji: "🎊", url: "https://cdn.pixabay.com/audio/2022/07/26/audio_124bfa1c82.mp3" },
  { id: "powerup",   label: "Power Up",   emoji: "⚡", url: "https://cdn.pixabay.com/audio/2022/01/13/audio_8cb6b35e3d.mp3" },
  { id: "woohoo",    label: "Woo-hoo!",   emoji: "🥳", url: "https://cdn.pixabay.com/audio/2022/03/10/audio_270f49d8a6.mp3" },
  { id: "custom",    label: "Custom MP3", emoji: "🎵", url: "" }, // URL provided separately via customSoundUrl
];

export type BannerSoundId = typeof BANNER_SOUNDS[number]["id"];
