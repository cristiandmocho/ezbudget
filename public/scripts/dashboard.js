import {
  formatAsCurrency,
  formatDate,
  showConfirmDialog,
  showToast,
} from "../../utils/utilities.js";

(async () => {
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

  async function loadChartData() {
    const dataExpenses = [
      ["Rent", 900],
      ["Groceries", 650],
      ["Food (out)", 250],
      ["Health & Pharma", 5],
      ["Education", 84 + 1.46 * 23 + 0], // Apoio Júlia + Almoço Francisco + Custos Júlia
      ["Transport", 5 + 50 + 28], // Bolt + Uber + TUB
      ["Utilities", 235], // Water + Electricity + Internet + TV
      ["Leisure", 75 + 4.99 + 11 + 15], // Geral + Amazon Prime + Netflix + XBox
      ["Taxes", 0.1 * 2200],
      ["Company Cost", 15.35 + 42.3 + 9 + 10 + 6 + 16.85 + 84.22 + 28.7], // GSuite + Adobe + Copilot + Midjourney + DigitalOcean + B2B + BTCompliance + Contabilidade
      ["Debts", 0],
      ["Others", 0],
    ];
    const totalExpenses = dataExpenses.reduce((a, b) => a + b[1], 0);

    google.charts.load("current", {
      packages: ["corechart"],
      language: "pt-PT",
    });

    google.charts.setOnLoadCallback(drawExpensesChart);
    google.charts.setOnLoadCallback(drawIncomeVsExpensesChart);

    function drawExpensesChart() {
      var data = new google.visualization.DataTable();
      data.addColumn("string", "Category");
      data.addColumn("number", "Value");
      data.addRows(dataExpenses);

      var options = {
        backgroundColor: "transparent",
        legend: {
          position: "right",
          textStyle: {
            color: "white",
            fontName: "Raleway",
            fontSize: 12,
          },
        },
        title: "Expenses Jan/2024",
        titleTextStyle: {
          color: "white",
          fontName: "Raleway",
          fontSize: 18,
          bold: false,
        },
      };

      var chart = new google.visualization.PieChart(
        document.getElementById("chart-expenses")
      );
      chart.draw(data, options);
    }

    function drawIncomeVsExpensesChart() {
      var data = google.visualization.arrayToDataTable([
        [
          "Category",
          { label: "Amount", format: "currency", type: "number" },
          { role: "style" },
        ],
        ["Income", 3300.0, "color: #008000"],
        ["Expenses", totalExpenses, "color: #ff0000"],
      ]);

      var options = {
        legend: "none",
        backgroundColor: "transparent",
        title: "Expenses vs Income",
        titleTextStyle: {
          color: "white",
          fontName: "Raleway",
          fontSize: 18,
          bold: false,
        },
        vAxis: {
          minValue: 0,
          format: "currency",
        },
      };

      var chart = new google.visualization.ColumnChart(
        document.getElementById("chart-income")
      );
      chart.draw(data, options);
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
  // loadTableData();
  loadChartData();

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
