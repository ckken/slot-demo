import Reel from "./Reel.js";
import Symbol from "./Symbol.js";

export default class Slot {
  constructor(domElement, config = {}) {
    this.currentSymbols = [
      ["death_star", "death_star", "death_star"],
      ["death_star", "death_star", "death_star"],
      ["death_star", "death_star", "death_star"],
      ["death_star", "death_star", "death_star"],
      ["death_star", "death_star", "death_star"],
    ];

    this.nextSymbols = [
      ["death_star", "death_star", "death_star"],
      ["death_star", "death_star", "death_star"],
      ["death_star", "death_star", "death_star"],
      ["death_star", "death_star", "death_star"],
      ["death_star", "death_star", "death_star"],
    ];

    this.container = domElement;
    this.isSpinning = false;
    this.reels = [];

    this.spinButton = document.getElementById("spin");
    this.autoPlayCheckbox = document.getElementById("autoplay");

    if (config.inverted) {
      this.container.classList.add("inverted");
    }

    this.config = config;

    // Disable spin until symbols are preloaded and reels are fully initialized.
    this.spinButton.disabled = true;
    this.init();
  }

  async init() {
    await Symbol.preload();

    this.reels = Array.from(this.container.getElementsByClassName("reel")).map(
      (reelContainer, idx) =>
        new Reel(reelContainer, idx, this.currentSymbols[idx]),
    );

    this.spinButton.addEventListener("click", () => this.spin());

    // Ensure first paint has correct sizing even on slow CSS/layout.
    requestAnimationFrame(() => {
      this.reels.forEach((reel) => reel.updateSizes());
      this.spinButton.disabled = false;
    });
  }

  spin() {
    // Prevent multiple simultaneous spins
    if (this.isSpinning) return Promise.resolve();

    this.isSpinning = true;
    this.currentSymbols = this.nextSymbols;
    this.nextSymbols = [
      [Symbol.random(), Symbol.random(), Symbol.random()],
      [Symbol.random(), Symbol.random(), Symbol.random()],
      [Symbol.random(), Symbol.random(), Symbol.random()],
      [Symbol.random(), Symbol.random(), Symbol.random()],
      [Symbol.random(), Symbol.random(), Symbol.random()],
    ];

    this.onSpinStart(this.nextSymbols);

    return Promise.all(
      this.reels.map((reel) => reel.spin(this.nextSymbols[reel.idx])),
    ).then(() => {
      this.isSpinning = false;
      this.onSpinEnd(this.nextSymbols);
    });
  }

  onSpinStart(symbols) {
    this.spinButton.disabled = true;

    this.config.onSpinStart?.(symbols);
  }

  onSpinEnd(symbols) {
    this.spinButton.disabled = false;

    this.config.onSpinEnd?.(symbols);

    if (this.autoPlayCheckbox.checked) {
      return window.setTimeout(() => this.spin(), 200);
    }
  }
}
