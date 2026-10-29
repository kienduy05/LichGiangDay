const fs = require('fs');
const path = require('path');

const storageDir = process.env.XEP_LICH_STORAGE_DIR
  ? path.resolve(process.env.XEP_LICH_STORAGE_DIR)
  : path.join(__dirname, 'data');
const storageFile = path.join(storageDir, 'sessions.json');

const ensureStorage = () => {
  fs.mkdirSync(storageDir, { recursive: true });
  if (!fs.existsSync(storageFile)) {
    fs.writeFileSync(storageFile, JSON.stringify({ sessions: {} }, null, 2), 'utf8');
  }
};

const readState = () => {
  ensureStorage();
  try {
    const parsed = JSON.parse(fs.readFileSync(storageFile, 'utf8'));
    return parsed && parsed.sessions ? parsed : { sessions: {} };
  } catch (_) {
    return { sessions: {} };
  }
};

const writeState = (state) => {
  ensureStorage();
  const temporaryFile = `${storageFile}.tmp`;
  fs.writeFileSync(temporaryFile, JSON.stringify(state, null, 2), 'utf8');
  fs.renameSync(temporaryFile, storageFile);
};

const clone = value => value ? JSON.parse(JSON.stringify(value)) : value;

class XepLichStore {
  static get = (maPhien) => clone(readState().sessions[maPhien] || null);

  static list = () => Object.values(readState().sessions).map(clone);

  static save = (session) => {
    const state = readState();
    state.sessions[session.phien.MaPhien] = session;
    writeState(state);
    return clone(session);
  };

  static remove = (maPhien) => {
    const state = readState();
    const existed = Boolean(state.sessions[maPhien]);
    delete state.sessions[maPhien];
    writeState(state);
    return existed;
  };

  static removeMany = (ids) => {
    const state = readState();
    const removed = [];
    for (const id of ids) {
      if (Object.hasOwn(state.sessions, id)) {
        delete state.sessions[id];
        removed.push(id);
      }
    }
    if (removed.length) writeState(state);
    return removed;
  };
}

module.exports = XepLichStore;
