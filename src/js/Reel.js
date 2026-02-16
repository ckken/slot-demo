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

    // Update sizes on resize and late layout/first-paint conditions
    this.updateSizes();
    this.ensureInitialLayout();
    window.addEventListener("resize", () => this.updateSizes());

    if (typeof ResizeObserver !== "undefined") {
      this._resizeObserver = new ResizeObserver(() => this.updateSizes());
      this._resizeObserver.observe(this.reelContainer);
    }
  }

  get extraSymbols() {
    // More symbols for longer reels = smoother scroll with visible motion
    return Math.floor(this.factor) * 15;
  }

  get factor() {
    // Increased factor for more dramatic staggered effect
    return 1.2 + Math.pow(this.idx / 2, 2);
  }

  updateSizes() {
    const reelHeight = this.reelContainer.getBoundingClientRect().height;
    if (!reelHeight || reelHeight < 10) return false;

    const symbolHeight = reelHeight / 3;

    // Set each symbol's height explicitly
    this.imgElements.forEach((img) => {
      img.style.height = `${symbolHeight}px`;
      img.style.minHeight = `${symbolHeight}px`;
    });

    return true;
  }

  ensureInitialLayout() {
    let attempts = 0;
    const maxAttempts = 20;

    const retry = () => {
      const ok = this.updateSizes();
      if (ok) return;
      attempts += 1;
      if (attempts < maxAttempts) {
        setTimeout(retry, 80);
      }
    };

    retry();
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
    // Use all available symbols for variety
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
      this.reelContainer.classList.add("spinning");
      this.prepareForSpin(nextSymbols);

      // Calculate scroll distance
      // We need to scroll so that the last 3 symbols become visible
      const reelHeight = this.reelContainer.offsetHeight;
      const symbolHeight = reelHeight / 3;
      const scrollDistance = (this.totalSlots - 3) * symbolHeight;

      // Apply the scroll animation with enhanced easing
      requestAnimationFrame(() => {
        // Duration based on factor - creates staggered stop effect
        const duration = this.factor * 800;

        // Use custom cubic-bezier for realistic slot machine feel
        // Fast start, gradual slowdown with slight bounce
        this.strip.style.transition = `transform ${duration}ms cubic-bezier(0.15, 0.85, 0.35, 1.02)`;
        this.strip.style.transform = `translateY(-${scrollDistance}px)`;

        // Wait for animation to complete
        setTimeout(() => {
          this.isSpinning = false;
          this.reelContainer.classList.remove("spinning");

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
