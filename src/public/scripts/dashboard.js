import {
  formatAsCurrency,
  formatDate,
  showConfirmDialog,
  showToast,
  getMonthNames,
} from "../../utils/utilities.js";

(async () => {
  let tableData = [];
  let currentDate = new Date();

  const monthNames = getMonthNames("en-GB", "short");

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

  function formatColumn(key, row) {
    if (!row || !key) return "";
    if (row[key] == null) return "";

    switch (key) {
      case "amount":
        return formatAsCurrency(row[key]);

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
    else return "";
  }

  async function loadTableData() {
    tbody.innerHTML = loadingRows;

    try {
      const movements = await fetch(
        `/api/movements?month=${
          currentDate.getMonth() + 1
        }&year=${currentDate.getFullYear()}`
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

  async function loadChartData() {
    const dataIncome = tableData
      .filter((row) => row.direction === "I")
      .map((row) => [row.category, row.amount])
      .reduce((a, b) => {
        a[b[0]] = a[b[0]] + b[1] || b[1];
        return a;
      }, {});

    const dataExpenses = tableData
      .filter((row) => row.direction === "E")
      .map((row) => [row.category, row.amount])
      .reduce((a, b) => {
        a[b[0]] = a[b[0]] + b[1] || b[1];
        return a;
      }, {});

    const totalExpenses = tableData
      .filter((row) => row.direction === "E")
      .reduce((a, b) => a + b.amount, 0);

    const totalIncome = tableData
      .filter((row) => row.direction === "I")
      .reduce((a, b) => a + b.amount, 0);

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
      data.addRows(Object.entries(dataExpenses));

      var options = {
        backgroundColor: "transparent",
        legend: "none",
        title: `Expenses ${
          monthNames[currentDate.getMonth()]
        }/${currentDate.getFullYear()}`,
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
        ["Income", totalIncome, "color: #008000"],
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
  await loadTableData();
  await loadChartData();

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
    .querySelector("ez-calendar")
    .addEventListener("calendarchange", async (e) => {
      currentDate.setFullYear(e.detail.year);
      currentDate.setMonth(e.detail.month);

      await loadTableData();
      await loadChartData();
    });
})();
