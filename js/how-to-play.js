const HOW_TO_PLAY_SEEN_KEY = "sq:howToPlaySeen";

const howToPlayPanelEl = document.querySelector("#howToPlayPanel");
const howToPlayCloseButtonEl = document.querySelector("#howToPlayCloseButton");
const howToPlayContentEl = document.querySelector("#howToPlayContent");
const howToPlayDotsEl = document.querySelector("#howToPlayDots");
const howToPlayNextButtonEl = document.querySelector("#howToPlayNextButton");

let howToPlayStep = 0;

export function hasSeenHowToPlay() {
  try { return !!localStorage.getItem(HOW_TO_PLAY_SEEN_KEY); } catch (_) { return false; }
}

function markHowToPlaySeen() {
  try { localStorage.setItem(HOW_TO_PLAY_SEEN_KEY, "1"); } catch (_) {}
}

function renderHowToPlaySlide() {
  const slides = howToPlayContentEl.querySelectorAll(".how-to-play-slide");
  const isLast = howToPlayStep === slides.length - 1;

  slides.forEach((slide, index) => {
    slide.hidden = index !== howToPlayStep;
  });

  howToPlayDotsEl.innerHTML = "";
  slides.forEach((_, index) => {
    const dotEl = document.createElement("span");
    dotEl.className = `how-to-play-dot${index === howToPlayStep ? " active" : ""}`;
    howToPlayDotsEl.appendChild(dotEl);
  });

  howToPlayNextButtonEl.textContent = isLast ? "Got it!" : "Next";
}

export function openHowToPlay() {
  howToPlayStep = 0;
  renderHowToPlaySlide();
  howToPlayPanelEl.hidden = false;
  // Force a reflow so the animation triggers after display is restored
  void howToPlayPanelEl.offsetWidth;
  howToPlayPanelEl.classList.add("is-open");
}

export function closeHowToPlay() {
  markHowToPlaySeen();
  howToPlayPanelEl.classList.remove("is-open");
  howToPlayPanelEl.hidden = true;
}

function handleNext() {
  const total = howToPlayContentEl.querySelectorAll(".how-to-play-slide").length;
  if (howToPlayStep < total - 1) {
    howToPlayStep += 1;
    renderHowToPlaySlide();
  } else {
    closeHowToPlay();
  }
}

howToPlayCloseButtonEl.addEventListener("click", closeHowToPlay);
howToPlayNextButtonEl.addEventListener("click", handleNext);
