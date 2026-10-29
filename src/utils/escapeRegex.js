/**
 * src/utils/escapeRegex.js
 * Utility to escape regular expression metacharacters in user-supplied strings.
 * Prevents RegExp injection, unhandled SyntaxErrors, and ReDoS (Denial of Service).
 *
 * @param {string} text - User input string to sanitize
 * @returns {string} Sanitized string safe for new RegExp() or MongoDB $regex
 */
function escapeRegex(text) {
  if (typeof text !== 'string') {
    return '';
  }
  // Escapes: . * + ? ^ $ { } ( ) | [ ] \ -
  return text.replace(/[.*+?^${}()|[\]\\-]/g, '\\$&');
}

module.exports = escapeRegex;
module.exports.escapeRegex = escapeRegex;

