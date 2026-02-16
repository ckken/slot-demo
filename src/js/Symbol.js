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
  static preload() {
    Symbol.symbols.forEach((symbol) => {
      const src = Symbol.getImageSrc(symbol);
      if (!imgCache[symbol]) {
        const img = new Image();
        img.src = src;
        imgCache[symbol] = img;
      }
    });
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
