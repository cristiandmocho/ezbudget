import { getBestContrastColor } from "../utils/utilities.js";

export default class ezBadge extends HTMLElement {
  static get observedAttributes() {
    return ["color", "uid", "label"];
  }

  constructor() {
    super();

    this.attachShadow({ mode: "open" });
    this.color = this.getAttribute("color");
    this.uid = this.getAttribute("uid");
    this.label = this.getAttribute("label");

    this.date = null;

    this.render();
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue !== newValue) {
      this[name] = newValue;
      this.render();
    }
  }

  render() {
    if (!this.color || !this.uid || !this.label) return;

    this.shadowRoot.innerHTML = `
      <div part="badge" style="box-sizing: border-box; text-wrap: nowrap; width: 100%; overflow: hidden; text-overflow:ellipsis; padding: 2px 4px; font-size: 0.75rem; border-radius: 4px; display: inline-block; background-color: ${
        this.color
      }; color: ${getBestContrastColor(this.color)};">${this.label}</div>`;

    const badge = this.shadowRoot.querySelector("div");

    function onClick(e) {
      e.stopPropagation();
      this.dispatchEvent(
        new CustomEvent("badgeclick", {
          bubbles: false,
          cancelable: true,
          composed: true,
          detail: { customer_uid: this.uid, date: this.date },
        })
      );
    }

    badge.addEventListener("click", onClick.bind(this));
  }
}
