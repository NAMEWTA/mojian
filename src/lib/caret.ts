const MIRROR_PROPS = [
  "boxSizing",
  "width",
  "paddingTop",
  "paddingRight",
  "paddingBottom",
  "paddingLeft",
  "borderTopWidth",
  "borderRightWidth",
  "borderBottomWidth",
  "borderLeftWidth",
  "fontStyle",
  "fontVariant",
  "fontWeight",
  "fontSize",
  "lineHeight",
  "fontFamily",
  "letterSpacing",
  "whiteSpace",
  "wordWrap",
  "wordBreak",
  "overflowWrap",
] as const;

export function textareaCaretRect(el: HTMLTextAreaElement, position: number) {
  const style = window.getComputedStyle(el);
  const mirror = document.createElement("div");
  for (const prop of MIRROR_PROPS) {
    mirror.style[prop] = style[prop];
  }
  mirror.style.position = "absolute";
  mirror.style.visibility = "hidden";
  mirror.style.whiteSpace = "pre-wrap";
  mirror.style.wordWrap = "break-word";
  mirror.style.top = "0";
  mirror.style.left = "-9999px";
  mirror.style.overflow = "hidden";
  mirror.textContent = el.value.slice(0, position);
  const marker = document.createElement("span");
  marker.textContent = "\u200b";
  mirror.appendChild(marker);
  document.body.appendChild(mirror);
  const box = el.getBoundingClientRect();
  const caret = new DOMRect(
    box.left - el.scrollLeft + marker.offsetLeft,
    box.top - el.scrollTop + marker.offsetTop,
    0,
    marker.offsetHeight || Number.parseFloat(style.lineHeight) || 24,
  );
  mirror.remove();
  return caret;
}
