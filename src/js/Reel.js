import Symbol from "./Symbol.js";

export default class Reel {
  constructor(reelContainer, idx, initialSymbols) {
    this.reelContainer = reelContainer;
    this.idx = idx;

    // Create a fixed strip container that holds all symbols
    this.strip = document.createElement("div");
    this.strip.classList.add("icons");
    this.reelContainer.appendChild(this.strip);

    // Pre-create symbol image elements (reuse them, never destroy)
    // We need: 3 visible + extra for scrolling illusion
    this.totalSlots = 3 + this.extraSymbols;
    this.imgElements = [];

    for (let i = 0; i < this.totalSlots; i++) {
      const img = document.createElement("img");
      img.classList.add("reel-symbol");
      img.draggable = false;
      this.strip.appendChild(img);
      this.imgElements.push(img);
    }

    // Set initial symbols at the TOP (visible area)
    this.currentSymbols = [...initialSymbols];
    this.setSymbolsToSlots(initialSymbols, 0);

    // Fill rest with random symbols
    for (let i = 3; i < this.totalSlots; i++) {
      this.setSymbolAt(i, Symbol.random());
    }

    // Animation state
    this.isSpinning = false;

    // Update sizes on window resize
    this.updateSizes();
    window.addEventListener("resize", () => this.updateSizes());
  }

  get extraSymbols() {
    // More symbols for longer reels = smoother scroll
    return Math.floor(this.factor) * 10;
  }

  get factor() {
    return 1 + Math.pow(this.idx / 2, 2);
  }

  updateSizes() {
    const reelHeight = this.reelContainer.offsetHeight;
    const symbolHeight = reelHeight / 3;

    // Set each symbol's height explicitly
    this.imgElements.forEach((img) => {
      img.style.height = `${symbolHeight}px`;
    });
  }

  setSymbolAt(slotIndex, symbolName) {
    if (slotIndex >= 0 && slotIndex < this.imgElements.length) {
      const img = this.imgElements[slotIndex];
      const src = Symbol.getImageSrc(symbolName);
      if (img.src !== src) {
        img.src = src;
      }
      img.alt = symbolName;
    }
  }

  setSymbolsToSlots(symbols, startIndex) {
    symbols.forEach((symbol, i) => {
      this.setSymbolAt(startIndex + i, symbol);
    });
  }

  prepareForSpin(nextSymbols) {
    // Reset strip position instantly (no animation)
    this.strip.style.transition = "none";
    this.strip.style.transform = "translateY(0)";

    // Force reflow to apply the reset
    void this.strip.offsetHeight;

    // Current symbols stay at top (positions 0-2)
    // They're already there from last spin

    // Fill middle with random symbols (positions 3 to totalSlots-4)
    for (let i = 3; i < this.totalSlots - 3; i++) {
      this.setSymbolAt(i, Symbol.random());
    }

    // Set the final 3 (destination symbols) at the bottom
    this.setSymbolsToSlots(nextSymbols, this.totalSlots - 3);
  }

  spin(nextSymbols) {
    return new Promise((resolve) => {
      if (this.isSpinning) {
        resolve();
        return;
      }

      this.isSpinning = true;
      this.prepareForSpin(nextSymbols);

      // Calculate scroll distance
      // We need to scroll so that the last 3 symbols become visible
      const reelHeight = this.reelContainer.offsetHeight;
      const symbolHeight = reelHeight / 3;
      const scrollDistance = (this.totalSlots - 3) * symbolHeight;

      // Apply the scroll animation
      requestAnimationFrame(() => {
        const duration = this.factor * 1000;

        this.strip.style.transition = `transform ${duration}ms cubic-bezier(0.25, 0.1, 0.25, 1)`;
        this.strip.style.transform = `translateY(-${scrollDistance}px)`;

        // Wait for animation to complete
        setTimeout(() => {
          this.isSpinning = false;

          // After animation, we need to:
          // 1. Reset transform to 0
          // 2. Move the final symbols to the top positions
          this.strip.style.transition = "none";
          this.strip.style.transform = "translateY(0)";

          // Copy final symbols to top positions
          for (let i = 0; i < 3; i++) {
            this.setSymbolAt(i, nextSymbols[i]);
          }

          this.currentSymbols = [...nextSymbols];

          resolve();
        }, duration);
      });
    });
  }
}
