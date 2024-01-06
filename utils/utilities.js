export function getMonthNames(lang = "en-GB", month = "long") {
  const { format } = new Intl.DateTimeFormat(lang, { month });

  return [...Array(12).keys()].map((month) =>
    format(new Date(Date.UTC(2023, month, 1)))
  );
}

export function getWeekdayNames(lang = "en-GB", weekday = "long") {
  const { format } = new Intl.DateTimeFormat(lang, { weekday });

  return [...Array(7).keys()].map((day) =>
    format(new Date(Date.UTC(2023, 0, day + 1)))
  );
}

export function getBestContrastColor(hexcolor) {
  // If a leading # is provided, remove it
  if (hexcolor.slice(0, 1) === "#") {
    hexcolor = hexcolor.slice(1);
  }

  // If a three-character hexcode, make six-character
  if (hexcolor.length === 3) {
    hexcolor = hexcolor
      .split("")
      .map(function (hex) {
        return hex + hex;
      })
      .join("");
  }

  // Convert to RGB value
  let r = parseInt(hexcolor.substr(0, 2), 16);
  let g = parseInt(hexcolor.substr(2, 2), 16);
  let b = parseInt(hexcolor.substr(4, 2), 16);

  // Get YIQ ratio (https://en.wikipedia.org/wiki/YIQ)
  let yiq = (r * 299 + g * 587 + b * 114) / 1000;

  // Check contrast
  return yiq >= 128 ? "black" : "white";
}

export function saveUserPrefs(prefs) {
  if (!prefs || !process.client) return;
  localStorage.setItem("ezSystems.ezInvoice3.userPrefs", JSON.stringify(prefs));
}

export function loadUserPrefs() {
  if (!process.client) return;

  const rawPrefs = localStorage.getItem("ezSystems.ezInvoice3.userPrefs");

  if (!rawPrefs) return {};
  return JSON.parse(rawPrefs);
}

export const formatAsCurrency = (value) => {
  if (value == null) return "N/A";
  return Intl.NumberFormat("en", { currency: "EUR", style: "currency" }).format(
    value
  );
};

export const formatDate = (date) => {
  if (!date) return "N/A";
  if (typeof date === "string") return date.substring(0, 10);
  return new Date(date).toISOString().split("T")[0]; // YYYY-MM-DD
};

export const formatAsEmail = (email) => {
  if (!email) return "N/A";
  return `<a href="mailto:${email}">${email}</a>`;
};

/**
 *
 * @param {Date} date1 First date to compare
 * @param {Date} date2 Second date to compare
 * @returns {boolean}
 */
export const compareDates = (date1, date2) => {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
};

export const showToast = (
  message,
  title = "Warning",
  type = "warning",
  icon = "warning"
) => {
  const $alert = document.querySelector("#toast").cloneNode(true);
  const $icon = $alert.querySelector("i");
  const $title = $alert.querySelector("h3");
  const $message = $alert.querySelector("span");

  if (!alert) return;

  $alert.setAttribute("variant", type);
  $icon.innerHTML = icon;
  $title.innerHTML = title;
  $message.innerHTML = message;

  $alert.toast();
};

export const showWarningDialog = ({ title = "Warning", message }) => {
  const $dialog = document.querySelector("#dialog").cloneNode(true);
  $dialog.setAttribute("label", title);
  $dialog.innerText = message;

  const $closeButton = document.createElement("sl-button");
  $closeButton.setAttribute("variant", "primary");
  $closeButton.setAttribute("slot", "footer");
  $closeButton.innerText = "Close";
  $closeButton.addEventListener("click", () => {
    $dialog.hide();
    $dialog.remove();
  });

  $dialog.appendChild($closeButton);

  document.body.appendChild($dialog);

  $dialog.show();

  return $dialog;
};

export const showConfirmDialog = ({ title = "Confirm action", message }) => {
  const $dialog = document.querySelector("#dialog").cloneNode(true);
  $dialog.setAttribute("label", title);
  $dialog.innerText = message;

  const $yesButton = document.createElement("sl-button");
  const $noButton = document.createElement("sl-button");

  $yesButton.setAttribute("variant", "primary");
  $yesButton.setAttribute("slot", "footer");
  $yesButton.innerText = "Yes";
  $yesButton.addEventListener("click", () => {
    $dialog.dispatchEvent(new CustomEvent("confirm"));
    $dialog.hide();
    $dialog.remove();
  });

  $noButton.setAttribute("variant", "secondary");
  $noButton.setAttribute("slot", "footer");
  $noButton.innerText = "No";
  $noButton.addEventListener("click", () => {
    $dialog.dispatchEvent(new CustomEvent("deny"));
    $dialog.hide();
    $dialog.remove();
  });

  $dialog.appendChild($yesButton);
  $dialog.appendChild($noButton);

  document.body.appendChild($dialog);

  $dialog.show();
  return $dialog;
};

export const ezDialog = ({
  title = "Dialog",
  content,
  buttons = [{ variant: "primary", text: "Ok", name: "btnOk" }],
  width = "640px",
  modal = true,
}) => {
  const $dialog = document.createElement("sl-dialog");
  $dialog.setAttribute("label", title);
  $dialog.classList.add("ez-dialog");
  $dialog.setAttribute("style", `--width: ${width};`);
  if (modal) $dialog.setAttribute("modal", true);

  $dialog.innerHTML = content;

  buttons.forEach((button) => {
    const $button = document.createElement("sl-button");
    $button.setAttribute("variant", button.variant);
    $button.setAttribute("slot", "footer");
    $button.innerText = button.text;
    $button.addEventListener("click", () => {
      $dialog.dispatchEvent(
        new CustomEvent("buttonclick", {
          detail: { name: button.name, button },
        })
      );
    });

    $dialog.appendChild($button);
  });

  $dialog.addEventListener("sl-request-close", (event) => {
    if (event.detail.source === "overlay") {
      event.preventDefault();
    }
  });

  document.body.appendChild($dialog);

  $dialog.close = () => {
    $dialog.hide();
    $dialog.remove();
  };

  return $dialog;
};

/**
 * @function fillDropdown Fills a dropdown with data
 * @param {HTMLSelectElement} dropdown The dropdown to fill
 * @param {Object[]} data Array of objects to fill the dropdown with
 * @param {string} valueField The field to use as value
 * @param {string} textField The field to use as text
 */
export const fillDropdown = (dropdown, data, valueField, textField) => {
  if (!dropdown) return;

  dropdown.innerHTML = "";

  const $option = document.createElement("option");
  $option.innerHTML = "-- Please select --";
  $option.value = "";

  dropdown.appendChild($option);

  data.forEach((item) => {
    const $option = document.createElement("option");

    $option.value = item[valueField ?? "value"];
    $option.innerHTML = item[textField ?? "text"];

    dropdown.appendChild($option);
  });
};

/**
 * Fills a form with data
 *
 * @param {HTMLFormElement} form - The form element to fill
 * @param {Object} data - Object containing data to populate the form with
 */
export const fillForm = (form, data) => {
  if (!form) return;

  Object.entries(data).forEach(([key, value]) => {
    const $input = form.querySelector(`[name="${key}"]`);
    if (!$input) return;
    if ($input.type === "checkbox") {
      $input.checked = value;
    } else {
      $input.value = value;
    }
  });
};
