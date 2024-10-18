const container = document.querySelector("#field-container");

let startX, startY;
let lastY = 1;

container.addEventListener("touchstart", (event) => {
  startX = event.targetTouches[0].clientX;
  startY = event.targetTouches[0].clientY;
});

container.addEventListener(
  "touchmove",
  (event) => {
    const currentScroll = document.documentElement.scrollTop;
    const deltaY = lastY - event.touches[0].clientY;

    if (currentScroll === 0 && deltaY < 0 && event.cancelable) {
      event.preventDefault();
      event.stopPropagation();
    }

    lastY = event.touches[0].clientY;
  },
  { passive: false }
);

container.addEventListener("touchend", (event) => {
  const deltaX = startX - event.changedTouches[0].clientX;
  const deltaY = startY - event.changedTouches[0].clientY;

  let detail;

  if (Math.abs(deltaX) > Math.abs(deltaY)) {
    detail = deltaX > 0 ? "ArrowLeft" : "ArrowRight";
  } else {
    detail = deltaY > 0 ? "ArrowUp" : "ArrowDown";
  }

  container.dispatchEvent(new CustomEvent("touch", { bubbles: true, detail }));
});

// добавляем слушаем слушателя события touch и передаем в него detail
// document.addEventListener("touch", (event) => {
//      event.detail
//   });
