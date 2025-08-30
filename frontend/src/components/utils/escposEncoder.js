// utils/escposEncoder.js
export default class EscPosEncoder {
  constructor() {
    this._buf = [];
  }
  initialize() {
    // ESC @
    this._buf.push(0x1b, 0x40);
    return this;
  }
  newline() {
    this._buf.push(0x0a);
    return this;
  }
  align(mode = 'lt') {
    const m = { lt: 0, ct: 1, rt: 2 }[mode] || 0;
    this._buf.push(0x1b, 0x61, m);
    return this;
  }
  line(text = '') {
    for (let i = 0; i < text.length; i++) {
      this._buf.push(text.charCodeAt(i));
    }
    return this;
  }
  leftRight(left = '', right = '') {
    const width = 32; // chars per line
    const pad = width - left.length - right.length;
    const line = left + ' '.repeat(pad < 0 ? 1 : pad) + right;
    return this.line(line);
  }
  cut() {
    // GS V 1
    this._buf.push(0x1d, 0x56, 1);
    return this;
  }
  encode() {
    return new Uint8Array(this._buf);
  }
}
