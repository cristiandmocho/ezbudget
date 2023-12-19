import { ONEDAY } from "./utils/constants.js";
import {
  ezDialog,
  formatAsCurrency,
  formatDate,
  getMonthNames,
  showConfirmDialog,
  showToast,
} from "./utils/utilities.js";

(async () => {
  let selectedRow = null;
  let tableData = [];

  const dataRow = (row) => {
    return `
  <tr data-uid="${row.uid}" class="${formatRow(row)}">
    <td><div style="display: grid; grid-template-columns: min-content auto;"><i class="mdi">${rowIcon(
      row
    )}</i><span>${formatColumn("invoice_no", row)}</span></div></td>
    <td><span>${formatColumn("customer_name", row)}</span></td>
    <td><span>${formatColumn("created", row)}</span></td>
    <td><span>${formatColumn("due_date", row)}</span></td>
    <td><span>${formatColumn("paid_on", row)}</span></td>
    <td><span>${formatColumn("status", row)}</span></td>
    <td><span>${formatColumn("value", row)}</span></td>
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

  async function loadTableData() {
    tbody.innerHTML = loadingRows;

    try {
      tableData = await fetch("/api/invoices").then((data) => data.json());
      tbody.innerHTML = tableData.length
        ? tableData.map(dataRow).join("")
        : noRows;
    } catch (e) {
      tbody.innerHTML = noRows;
      showToast(
        `Failed to load invoices. ${e.message}`,
        "Error",
        "danger",
        "cancel"
      );
    }
  }

  function rowIcon(row) {
    let icon = "";

    switch (row.status) {
      case "C":
        icon = "cancel";
        break;

      case "P":
        icon = "print";
        break;

      case "S":
        icon = "email";
        break;

      case "X":
        icon = "check";
        break;

      default:
        icon = "edit";
        break;
    }

    if (new Date(row.due_date) < new Date() && !["C", "X"].includes(row.status))
      icon = "warning";

    return icon;
  }

  function formatColumn(key, row) {
    switch (key) {
      case "created":
      case "due_date":
      case "paid_on":
        return row[key] ? formatDate(row[key]) : "";

      case "status":
        if (row[key] === "C") return "Cancelled";
        if (row[key] === "P") return "Printed";
        if (row[key] === "S") return "Sent";
        if (row[key] === "X") return "Paid";

        return "Draft";

      case "value":
        return formatAsCurrency(Number(row[key]));

      default:
        return row[key];
    }
  }

  function formatRow(row) {
    let css = [];

    if (new Date(row.due_date) < new Date() && !["C", "X"].includes(row.status))
      css.push("overdue");

    if (row.status === "C") css.push("cancelled");

    return css.join(" ");
  }

  function selectRow(tr) {
    selectedRow = tableData.find(
      (row) => row.uid === tr.getAttribute("data-uid")
    );

    tr.parentNode.querySelector("tr.selected")?.classList?.remove("selected");
    tr.classList.add("selected");
  }

  async function openNewInvoiceDialog() {
    const dlg = ezDialog({
      title: "New Invoice",
      content: document.querySelector("#dlgNewInvoice").innerHTML,
      buttons: [
        { text: "Save", variant: "primary", name: "btnSave" },
        { text: "Cancel", variant: "danger", name: "btnCancel" },
      ],
      width: "810px",
    });

    dlg.show();

    // Invoice dialog stuff
    const currentDate = new Date();
    const customersData = await fetch("/api/customers").then((data) =>
      data.json()
    );

    const invoiceData = {
      invoice_no: null,
      created: formatDate(new Date()),
      due_date: formatDate(new Date().valueOf() + ONEDAY * 15),
      paid_on: null,
      customer_uid: null,
      sent: null,
      details: "",
      reference: {
        month: new Date().getMonth(),
        year: new Date().getFullYear(),
      },
    };
    const invoiceLines = [];

    let firstLineId = null;
    let total = 0;

    async function saveInvoice() {
      if (!invoiceData.customer_uid) {
        showToast("Please select a customer", "Error", "danger", "cancel");
        return;
      }

      if (invoiceLines.length === 0) {
        showToast("Please add at least one line", "Error", "danger", "cancel");
        return;
      }

      if (!invoiceData.reference.month || !invoiceData.reference.year) {
        showToast(
          "Please select a reference month and year",
          "Error",
          "danger",
          "cancel"
        );
        return;
      }

      if (!invoiceData.due_date) {
        showToast("Please select a due date", "Error", "danger", "cancel");
        return;
      }

      if (!invoiceData.created) {
        showToast("Please select a creation date", "Error", "danger", "cancel");
        return;
      }

      const data = {
        invoice: { ...invoiceData },
        lines: [...invoiceLines],
      };

      try {
        await fetch("/api/invoice", {
          method: "POST",
          body: JSON.stringify(data),
          headers: { "Content-Type": "application/json" },
        });

        showToast(
          "Successfully created new invoice",
          "Success",
          "success",
          "check"
        );

        dlg.close();

        loadTableData();
      } catch (e) {
        showToast(
          `Failed to create new invoice. ${e.message}`,
          "Error",
          "danger",
          "cancel"
        );
      }
    }

    function addLine({
      description = "",
      quantity = 1,
      price = 0,
      discount = 0,
      vat = 0,
    }) {
      const _id = new Date().valueOf();
      invoiceLines.push({
        _id,
        description,
        quantity,
        price,
        discount,
        vat,
      });

      return _id;
    }

    function handleLineValuesChange(e) {
      const tr = e.currentTarget;
      const line = invoiceLines.find(
        (line) => line._id.toString() === tr.getAttribute("data-id")
      );
      const attr = e.target.name;
      const value = e.target.value;

      if (line) {
        line[attr] = value;
        updateLine(line._id, line);
      }
    }

    function handleInvoiceChanges(e) {
      const attr = e.target.name;
      const value = e.target.value;

      invoiceData[attr] = value;
    }

    function handleRefChange(e) {
      if (e.target.name === "month")
        invoiceData.reference.month = Number(e.target.value);
      else invoiceData.reference.year = Number(e.target.value);

      updateFirstLine();
    }

    function handleCustomerChange(e) {
      invoiceData.customer_uid = e.target.value;
      updateFirstLine();
    }

    async function updateFirstLine() {
      if (invoiceLines.length === 0) {
        firstLineId = addLine({});
        dlg
          .querySelector("table tbody tr:first-child")
          .setAttribute("data-id", firstLineId);
      }

      if (
        !invoiceData.customer_uid ||
        !invoiceData.reference.month ||
        !invoiceData.reference.year
      )
        return;

      const types = {
        D: "Daily",
        H: "Hourly",
        F: "Fixed montlhy",
      };

      const firstLine = invoiceLines.find((line) => line._id === firstLineId);
      const customer = customersData.find(
        (cus) => cus.uid === invoiceData.customer_uid
      );
      const calendarInfo = await fetch(
        `/api/customer/${customer.uid}/calendar?month=${invoiceData.reference.month}&year=${invoiceData.reference.year}`
      ).then((data) => data.json());

      const referenceText = `${
        getMonthNames("en")[invoiceData.reference.month]
      } ${invoiceData.reference.year}`;

      invoiceData.invoice_no = `${invoiceData.reference.year}${(
        invoiceData.reference.month + 1
      )
        .toString()
        .padStart(2, "0")}${customer.customer_index
        .toString()
        .padStart(2, "0")}01`;

      updateLine(firstLineId, {
        description: `Consulting services ref. ${referenceText} - ${
          types[customer.type]
        } rate`,
        quantity: customer.type === "F" ? 1 : calendarInfo.length,
        price: customer.rate,
        discount: firstLine.discount ?? 0,
        vat: customer.vat,
      });
    }

    function updateLine(id, data) {
      const line = invoiceLines.find((line) => line._id === id);
      Object.assign(line, data);

      // Shows values
      const tr = dlg.querySelector(`[data-id="${id}"]`);
      tr.querySelector("[name='description']").value = line.description;
      tr.querySelector("[name='quantity']").value = line.quantity;
      tr.querySelector("[name='price']").value = line.price;
      tr.querySelector("[name='discount']").value = line.discount;
      tr.querySelector("[name='vat']").value = line.vat;

      // Shows total
      total = invoiceLines.reduce((acc, line) => {
        return (
          acc +
          line.quantity * line.price -
          line.discount +
          (line.vat / 100) * line.quantity * line.price
        );
      }, 0);

      dlg.querySelector(".total").innerText = formatAsCurrency(total);
    }

    // Dialog initialization
    updateFirstLine();

    const customerSelect = dlg.querySelector("[name='customer_uid']");
    const monthSelect = dlg.querySelector("[name='month']");
    const yearInput = dlg.querySelector("[name='year']");

    const detailsInput = dlg.querySelector("[name='details']");
    const createdInput = dlg.querySelector("[name='created']");
    const dueDateInput = dlg.querySelector("[name='due_date']");
    const paidOnInput = dlg.querySelector("[name='paid_on']");
    const sentInput = dlg.querySelector("[name='sent']");

    // Initial values
    customerSelect.innerHTML = "";

    const option = document.createElement("option");
    option.value = "";
    option.disabled = true;
    option.selected = true;
    option.innerText = "-- Please select --";
    customerSelect.appendChild(option);

    customersData?.forEach((customer) => {
      const option = document.createElement("option");
      option.value = customer.uid;
      option.innerText = customer.name;

      customerSelect.appendChild(option);
    });

    const monthNames = getMonthNames("en", "long");

    monthSelect.innerHTML = "";
    monthNames.forEach((name, index) => {
      const option = document.createElement("option");
      option.value = index;
      option.innerText = name;

      if (index === currentDate.getMonth()) option.selected = true;

      monthSelect.appendChild(option);
    });

    yearInput.value = currentDate.getFullYear();

    createdInput.value = formatDate(currentDate);
    dueDateInput.value = formatDate(currentDate.valueOf() + ONEDAY * 15);

    handleInvoiceChanges({ target: createdInput });
    handleInvoiceChanges({ target: dueDateInput });

    // Dialog events
    dlg.addEventListener("buttonclick", (e) => {
      if (e.detail.name === "btnSave") {
        return saveInvoice();
      }

      dlg.close();
    });

    dlg
      .querySelector("[name='customer_uid']")
      .addEventListener("change", handleCustomerChange);

    dlg
      .querySelector("[name='month']")
      .addEventListener("change", handleRefChange);

    dlg
      .querySelector("[name='year']")
      .addEventListener("change", handleRefChange);

    dlg
      .querySelector("table input[type=number]")
      .addEventListener("change", handleLineValuesChange);

    detailsInput.addEventListener("change", handleInvoiceChanges);
    createdInput.addEventListener("change", handleInvoiceChanges);
    dueDateInput.addEventListener("change", handleInvoiceChanges);
    paidOnInput.addEventListener("change", handleInvoiceChanges);
    sentInput.addEventListener("change", handleInvoiceChanges);
  }

  async function updateRow(row) {
    const { uid, status } = row;

    try {
      await fetch(`/api/invoice/${uid}`, {
        method: "PATCH",
        body: `{"status": "${status}"}`,
        headers: { "Content-Type": "application/json" },
      });

      showToast(`Invoice successfully updated`, "Success", "success", "check");

      tableData.find((row) => {
        if (row.uid === uid) row.status = status;
      });

      loadTableData();
    } catch (err) {
      showToast(
        `Failed to update invoice ${uid} to status ${status}. ${err.message}`,
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
        openNewInvoiceDialog();
        break;

      case "cancel": {
        const dlg = showConfirmDialog({
          message: "Are you sure you want to cancel this invoice?",
        });

        dlg.addEventListener("confirm", () => {
          updateRow({ uid: selectedRow.uid, status: "C" });
        });

        break;
      }

      case "print":
        location.assign(`/invoice/print/${selectedRow.uid}`);
        break;

      case "sent":
        updateRow({ uid: selectedRow.uid, status: "S" });
        break;

      case "paid":
        updateRow({ uid: selectedRow.uid, status: "X" });
        break;

      case "printed":
        updateRow({ uid: selectedRow.uid, status: "P" });
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
