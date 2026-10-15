/**
 * Emoji untuk pemilih GroupChat (tanpa dependensi), dikelompokkan per kategori.
 * Dipakai juga untuk reaksi → setiap item WAJIB lolos validEmoji di server (chat_interactions.go):
 * jangan tambahkan keycap (1️⃣ #️⃣), emoji bercampur ASCII/huruf, atau simbol non-So seperti ↔️ / ℹ️ (ditolak 422).
 */
export const EMOJI_GROUPS = [
  {
    id: 'senyum',
    label: 'Senyum',
    icon: '😀',
    items: '😀 😃 😄 😁 😆 😅 🤣 😂 🙂 😉 😊 😇 🥰 😍 🤩 😘 😋 😜 🤪 😎 🤓 🧐 🤔 🤗 🤭 🤫 😶 😐 😏 😌 😴 🥱 😮 😲 😳 🥺 😢 😭 😤 😡 🤯 😱 😬 🙄 🥳 🤠 😷 🤒'.split(' '),
  },
  {
    id: 'gerakan',
    label: 'Gerakan',
    icon: '👍',
    items: '👍 👎 👌 ✌️ 🤞 🤟 🤘 👏 🙌 👐 🤲 🙏 🤝 💪 👋 🤙 ✋ ☝️ 👆 👇 👉 👈 ✍️ 🫡 🫶 👀'.split(' '),
  },
  {
    id: 'hati',
    label: 'Hati & simbol',
    icon: '❤️',
    items: '❤️ 🧡 💛 💚 💙 💜 🖤 🤍 💯 ✨ ⭐ 🌟 🔥 💥 🎉 🎊 ✅ ❌ ⚠️ ❗ ❓ 💡 📌 🏆 🥇 🎯 🚀'.split(' '),
  },
  {
    id: 'belajar',
    label: 'Belajar',
    icon: '📚',
    items: '📚 📖 📝 ✏️ 🖊️ 📒 📓 📄 📑 📊 📈 🗂️ 🧠 💻 ⏰ ⏳ 🕐 📅 🎓 🏫 🇮🇩 🏛️ ☕ 🍵 🍜'.split(' '),
  },
];
