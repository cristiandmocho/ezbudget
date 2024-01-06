import { fillForm, showToast } from "../../utils/utilities.js";

(async () => {
  let tableData = [];
  let selectedRow = null;

  const dataRow = (row) => {
    return `
      <tr data-uid="${row.uid}">
        <td><span>${formatColumn("name", row)}</span></td>
        <td><span>${formatColumn("color", row)}</span></td>
        <td><span>${formatColumn("description", row)}</span></td>
        <td><span>${formatColumn("order", row)}</span></td>
      </tr>`;
  };

  const noRows = `
    <tr>
      <td class="no-rows" colspan="4">
        <span> No rows to show</span>
      </td>
    </tr>`;

  const loadingRows = `
    <tr>
      <td class="no-rows" colspan="4">
        <i class="mdi spin">settings</i>&nbsp;<span>Loading... Please wait...</span>
      </td>
    </tr>`;

  const table = document.querySelector("table");
  const tbody = table.querySelector("tbody");
  const form = document.querySelector("form");

  async function loadTableData() {
    tbody.innerHTML = loadingRows;

    try {
      tableData = await fetch("/api/categories").then((data) => data.json());
      tbody.innerHTML = tableData.length
        ? tableData.map(dataRow).join("")
        : noRows;
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
    switch (key) {
      case "color":
        return `<span style="background-color: ${row[key]}; width: 20px; height: 20px; display: inline-block; border: solid 1px #eee"></span>`;

      default:
        return row[key] ?? "";
    }
  }

  function selectRow(tr) {
    selectedRow = tableData.find(
      (row) => row.uid === tr.getAttribute("data-uid")
    );

    tr.parentNode.querySelector("tr.selected")?.classList?.remove("selected");
    tr.classList.add("selected");
  }

  async function loadCategory(uid) {
    try {
      const category = await fetch(`/api/category/${uid}`).then((data) =>
        data.json()
      );

      fillForm(form, category);
    } catch (e) {
      showToast(
        `Failed to load data. ${e.message}`,
        "Error",
        "danger",
        "cancel"
      );
    }
  }

  async function updateCategory(row) {
    const { uid } = row;

    try {
      await fetch(`/api/category/${uid}`, {
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

  async function deleteCategory(row) {
    const { uid } = row;

    try {
      await fetch(`/api/category/${uid}`, { method: "DELETE" });

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
        break;

      case "delete": {
        const dlg = showConfirmDialog({
          message: "Are you sure you want to DELETE this category?",
        });

        dlg.addEventListener("confirm", () => {
          deleteCategory({ uid: selectedRow.uid });
        });

        break;
      }

      case "edit":
        loadCategory(selectedRow.uid);
        break;

      default:
        showToast("Not implemented yet");
        break;
    }
  }

  // Initializing
  loadTableData();

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
})();
