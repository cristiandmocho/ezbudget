import {
  fillForm,
  fillDropdown,
  clearForm,
  readForm,
  validateForm,
  showToast,
  showConfirmDialog,
  formatDate,
} from "../../utils/utilities.js";

(async () => {
  let tableData = [];
  let selectedRow = null;
  let dirty = false;

  const dataRow = (row) => {
    return `
      <tr data-uid="${row.uid}" class="${rowClasses(row)}">
        <td><span>${formatColumn("title", row)}</span></td>
        <td><span>${formatColumn("direction", row)}</span></td>
        <td><span>${formatColumn("category", row)}</span></td>
        <td><span>${formatColumn("amount", row)}</span></td>
        <td><span>${formatColumn("recur_type", row)}</span></td>
        <td><span>${formatColumn("due_date", row)}</span></td>
        <td><span>${formatColumn("paid_on", row)}</span></td>
      </tr>`;
  };

  const noRows = `
    <tr>
      <td class="no-rows" colspan="7">
        <span> No rows to show</span>
      </td>
    </tr>`;

  const loadingRows = `
    <tr>
      <td class="no-rows" colspan="7">
        <i class="mdi spin">settings</i>&nbsp;<span>Loading... Please wait...</span>
      </td>
    </tr>`;

  const table = document.querySelector("table");
  const tbody = table.querySelector("tbody");
  const form = document.querySelector("form");

  // Pagination
  const pageSize = document.querySelector('[name="pagesize"]'); // select
  const pageNum = document.querySelector('[name="pagenum"]'); // input
  const numRecords = document.querySelector('[name="numrecords"]'); // span
  const maxPages = document.querySelector('[name="maxpages"]'); // span

  async function loadCategories() {
    const categories = await fetch("/api/categories").then((data) =>
      data.json()
    );
    const select = form.querySelector('[name="category_uid"]');

    fillDropdown(select, categories, "uid", "name");
  }

  async function loadTableData() {
    tbody.innerHTML = loadingRows;

    try {
      const movements = await fetch(
        `/api/movements?pageSize=${pageSize.value}&pageNum=${pageNum.value}`
      ).then((data) => data.json());

      tableData = movements.data;

      // Map the dates
      tableData.forEach((row) => {
        if (row.created_on) row.created_on = new Date(row.created_on);
        if (row.due_date) row.due_date = new Date(row.due_date);
        if (row.paid_on) row.paid_on = new Date(row.paid_on);
      });

      tbody.innerHTML = tableData.length
        ? tableData.map(dataRow).join("")
        : noRows;

      // Update pagination
      const numRows = movements.totalRecords;
      const numPages = numRecords > 0 ? Math.ceil(numRows / pageSize.value) : 1;

      pageNum.max = numPages;
      pageNum.value = 1;

      numRecords.innerHTML = numRows;
      maxPages.innerHTML = numPages;
    } catch (e) {
      tbody.innerHTML = noRows;
      showToast(
        `Failed to load data. ${e.message}`,
        "Error",
        "danger",
        "cancel"
      );
    }
  }

  function formatColumn(key, row) {
    if (!row || !key) return "";
    if (row[key] == null) return "";

    switch (key) {
      case "amount":
        return Intl.NumberFormat("pt-PT", {
          style: "currency",
          currency: row.currency,
        }).format(row[key]);

      case "direction":
        return row[key] === "I" ? "Income" : "Expense";

      case "recur_type":
        switch (row[key]) {
          default:
            return "";
          case 0:
            return "None";
          case 1:
            return "Monthly";
          case 2:
            return "Quarterly";
          case 3:
            return "Semi-annual";
          case 4:
            return "Yearly";
        }
      case "due_date":
      case "paid_on":
        return formatDate(row[key]);

      default:
        return row[key].toString();
    }
  }

  function rowClasses(row) {
    if (row.due_date < new Date()) return "past-due";
  }

  function selectRow(tr) {
    selectedRow = tableData.find(
      (row) => row.uid === tr.getAttribute("data-uid")
    );

    tr.parentNode.querySelector("tr.selected")?.classList?.remove("selected");
    tr.classList.add("selected");
  }

  async function loadMovement(uid) {
    try {
      const movement = await fetch(`/api/movement/${uid}`).then((data) =>
        data.json()
      );

      // Map the dates
      if (movement.created_on)
        movement.created_on = new Date(movement.created_on);
      if (movement.due_date) movement.due_date = new Date(movement.due_date);
      if (movement.paid_on) movement.paid_on = new Date(movement.paid_on);

      fillForm(form, movement);
    } catch (e) {
      showToast(
        `Failed to load data. ${e.message}`,
        "Error",
        "danger",
        "cancel"
      );
    }
  }

  async function saveMovement(row) {
    try {
      await fetch(`/api/movement`, {
        method: "POST",
        body: JSON.stringify(row),
        headers: { "Content-Type": "application/json" },
      });

      showToast(`Data successfully saved`, "Success", "success", "check");

      loadTableData();
    } catch (err) {
      showToast(
        `Failed to save data. ${err.message}`,
        "Error",
        "danger",
        "cancel"
      );
    }
  }

  async function updateMovement(row) {
    const { uid } = row;

    try {
      await fetch(`/api/movement/${uid}`, {
        method: "PATCH",
        body: JSON.stringify(row),
        headers: { "Content-Type": "application/json" },
      });

      showToast(`Data successfully updated`, "Success", "success", "check");

      loadTableData();
    } catch (err) {
      showToast(
        `Failed to update data. ${err.message}`,
        "Error",
        "danger",
        "cancel"
      );
    }
  }

  async function deleteMovement(row) {
    const { uid } = row;

    try {
      await fetch(`/api/movement/${uid}`, { method: "DELETE" });

      showToast(`Data successfully deleted`, "Success", "success", "check");

      loadTableData();
    } catch (err) {
      showToast(
        `Failed to delete data. ${err.message}`,
        "Error",
        "danger",
        "cancel"
      );
    }
  }

  function toolbarButtonClickHandler(e) {
    const btn = e.target.closest("sl-button").getAttribute("name");

    if (btn !== "new" && !selectedRow) {
      showToast("Please select a row first");
      return;
    }

    switch (btn) {
      case "new":
        clearForm(form);
        form.querySelector("input").focus();
        break;

      case "delete": {
        const dlg = showConfirmDialog({
          message: "Are you sure you want to DELETE this movement?",
        });

        dlg.addEventListener("confirm", () => {
          deleteMovement({ uid: selectedRow.uid });
        });

        break;
      }

      case "edit":
        loadMovement(selectedRow.uid);
        break;

      case "duplicate":
      default:
        showToast(`Not implemented yet: ${btn}`);
        break;
    }
  }

  function pageButtonClickHandler(e) {
    const btn = e.target.closest("sl-button").getAttribute("name");

    async function saveData() {
      if (dirty) {
        const isValid = validateForm(form);
        if (isValid) {
          if (selectedRow) {
            const row = readForm(form);
            row.uid = selectedRow.uid;

            await updateMovement(row);
          } else {
            const row = readForm(form);
            await saveMovement(row);
          }

          dirty = false;
          selectedRow = null;

          clearForm(form);
          form.querySelector("input").focus();
        }
      }
    }

    switch (btn) {
      case "btnSave":
        saveData();
        break;

      case "btnSaveClose": {
        saveData();
        location.assign("/dashboard");

        break;
      }

      case "btnClose":
        if (dirty) {
          const confirm = showConfirmDialog({
            title: "Discard Changes",
            message:
              "You have unsaved changes. Are you sure you want to discard them?",
          });

          confirm.addEventListener("confirm", () => {
            location.assign("/dashboard");
          });
        } else {
          location.assign("/dashboard");
        }
        break;

      default:
        showToast(`Not implemented yet: ${btn}`);
        break;
    }
  }

  // Initializing
  loadTableData();
  loadCategories();
  clearForm(form);

  form.querySelector("input").focus();

  // DOM Events
  document.querySelector("table").addEventListener("click", (e) => {
    if (e.target.tagName !== "TR") {
      selectRow(e.target.closest("tr"));
    } else {
      selectRow(e.target);
    }
  });

  document
    .querySelector(".toolbar")
    .addEventListener("click", toolbarButtonClickHandler);

  document
    .querySelector(".buttons")
    .addEventListener("click", pageButtonClickHandler);

  form.addEventListener("change", (e) => {
    dirty = true;
  });
})();
