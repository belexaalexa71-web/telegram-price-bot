const pendingInput = new Map();

function setPending(userId, type) { pendingInput.set(String(userId), type); }
function getPending(userId) { return pendingInput.get(String(userId)); }
function clearPending(userId) { pendingInput.delete(String(userId)); }

module.exports = { setPending, getPending, clearPending };
