// ===== 線画アイコン（絵文字の代わり。機種で絵が変わらない）=====
// データ側(data.js/guide.js/dict.js)の絵文字はそのまま残し、表示時にここで置き換える。
// 絵文字はカレンダー(.ics)の予定名などテキストでは引き続き使う。
const ICON_PATHS = {
  flame:   '<path d="M12 3c.8 3.4 5 5.6 5 10.2A5 5 0 0 1 7 13.2c0-2.4 1.3-3.9 2.4-5 .3 2 1.4 3 2.4 3.1C11 8.4 11.9 5.6 12 3z"/>',
  bottle:  '<path d="M10 2.8h4M10.5 2.8v3.1L8.6 8.7v10.6a2 2 0 0 0 2 2h2.8a2 2 0 0 0 2-2V8.7l-1.9-2.8V2.8M8.6 12.5h6.8"/>',
  recycle: '<path d="M12 17l-2 2 2 2M10 19h9a2 2 0 0 0 1.75-2.75l-.55-1M8.54 11l-.73-2.73-2.73.73M7.8 8.27l-4.5 7.8a2 2 0 0 0 1.5 2.88l1.15.03M15.46 11l2.73.73.73-2.73M18.2 11.73l-4.5-7.8a2 2 0 0 0-3.26-.13l-.6.97"/>',
  nut:     '<path d="M12 2.8l8 4.6v9.2l-8 4.6-8-4.6V7.4z"/><circle cx="12" cy="12" r="3"/>',
  bowl:    '<path d="M3.5 10.5h17a8.5 8.5 0 0 1-17 0zM9 21h6M13 10.5l-1.5 3 2 1.5-1 2.5"/>',
  trash:   '<path d="M4 7h16M10 11v6M14 11v6M5.5 7l.9 12.2A2 2 0 0 0 8.4 21h7.2a2 2 0 0 0 2-1.8L18.5 7M9 7V4.5A1.5 1.5 0 0 1 10.5 3h3A1.5 1.5 0 0 1 15 4.5V7"/>',
  box:     '<path d="M12 3l8 4.5v9L12 21l-8-4.5v-9zM12 12l8-4.5M12 12v9M12 12L4 7.5"/>',
  phone:   '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/>',
  alert:   '<path d="M12 9v4M12 17h.01M10.3 3.9 2.4 18a2 2 0 0 0 1.7 3h15.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/>',
  sofa:    '<path d="M4.5 11V8a3 3 0 0 1 3-3h9a3 3 0 0 1 3 3v3M2.5 13a2 2 0 0 1 4 0v2h11v-2a2 2 0 0 1 4 0v5h-19zM5 18v2M19 18v2"/>',
  tv:      '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M16 3l-4 4-4-4"/>',
  camera:  '<path d="M5 7h2l2-3h6l2 3h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2"/><circle cx="12" cy="13" r="3.5"/>',
  bulb:    '<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2V16h5v-.1c0-.8.4-1.5 1-2A6 6 0 0 0 12 3z"/>',
  search:  '<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>',
  pin:     '<path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.3"/>',
  bell:    '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10 21h4"/>',
  globe:   '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>',
  clock:   '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  leaf:    '<path d="M5 21c.5-6 4-11 15-17-1 10-6 14-11 14-1.5 0-3-.5-4-1M5 21l7-8"/>',
  chev:    '<path d="M9 6l6 6-6 6"/>',
  check:   '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
};
const EMOJI_ICON = { "🔥":"flame", "♳":"bottle", "♻️":"recycle", "♻":"recycle", "🔩":"nut", "🪨":"bowl",
  "🗑️":"trash", "🗑":"trash", "📦":"box", "📞":"phone", "⚠️":"alert", "🛋️":"sofa", "📺":"tv" };

// name か絵文字を受け取り、SVG文字列を返す（知らない絵文字はそのまま返す）
function ic(nameOrEmoji, cls){
  const n = ICON_PATHS[nameOrEmoji] ? nameOrEmoji : EMOJI_ICON[nameOrEmoji];
  if (!n) return nameOrEmoji || "";
  return `<svg class="i${cls?" "+cls:""}" viewBox="0 0 24 24" aria-hidden="true">${ICON_PATHS[n]}</svg>`;
}
