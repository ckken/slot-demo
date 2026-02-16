// Image source cache - preloaded once
const srcCache = {};
const imgCache = {};

export default class Symbol {
  constructor(name = Symbol.random()) {
    this.name = name;
  }

  // Get the image source URL for a symbol name
  static getImageSrc(name) {
    if (!srcCache[name]) {
      srcCache[name] = require(`../assets/symbols/${name}.svg`);
    }
    return srcCache[name];
  }

  // Preload all symbol images into browser cache
  // Returns a Promise so callers can wait for first-paint safety.
  static preload() {
    const tasks = Symbol.symbols.map((symbol) => {
      const src = Symbol.getImageSrc(symbol);
      if (!imgCache[symbol]) {
        const img = new Image();
        imgCache[symbol] = img;
        return new Promise((resolve) => {
          img.onload = () => resolve(true);
          img.onerror = () => resolve(false);
          img.src = src;
        });
      }

      const img = imgCache[symbol];
      if (img.complete) return Promise.resolve(true);
      return new Promise((resolve) => {
        const done = () => resolve(true);
        img.addEventListener("load", done, { once: true });
        img.addEventListener("error", done, { once: true });
      });
    });

    return Promise.all(tasks);
  }

  static get symbols() {
    return [
      "at_at",
      "c3po",
      "darth_vader",
      "death_star",
      "falcon",
      "r2d2",
      "stormtrooper",
      "tie_ln",
      "yoda",
    ];
  }

  static random() {
    return this.symbols[Math.floor(Math.random() * this.symbols.length)];
  }
}
