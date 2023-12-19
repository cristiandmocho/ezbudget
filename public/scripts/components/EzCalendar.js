import {
  getWeekdayNames,
  getMonthNames,
  compareDates,
  formatDate,
} from "../utils/utilities.js";

export default class ezCalendar extends HTMLElement {
  constructor() {
    super();

    this.attachShadow({ mode: "open" });

    this.lang = this.getAttribute("lang");
    this.data = [];
    this.customerData = [];
    this.holidaysData = [];
    this.selectedCustomer = null;
    this.currentDate = new Date();
    this.selectedDate = new Date(
      this.currentDate.getFullYear(),
      this.currentDate.getMonth(),
      1
    );
  }

  // Build the table data
  refreshTableData = () => {
    const calendar = this.shadowRoot.querySelector(".ez-calendar");
    const table = calendar.querySelector(".table");
    const tableBody = table.querySelector(".tbody");

    Array.from(tableBody.querySelectorAll("div[data-date]")).forEach((div) => {
      const workInfo = this.data.filter(
        (row) =>
          compareDates(row.work_date, new Date(div.dataset.date)) &&
          row.customer_uid
      );

      div.querySelectorAll("ez-badge").forEach((badge) => badge.remove());
      workInfo.forEach((row) => {
        const badge = document.createElement("ez-badge");
        badge.setAttribute("label", row.name);
        badge.setAttribute("color", row.color);
        badge.setAttribute("uid", row.customer_uid);
        badge.date = row.work_date;
        badge.addEventListener("badgeclick", (e) => {
          e.stopPropagation();

          this.dispatchEvent(
            new CustomEvent("badgeclick", {
              bubbles: false,
              cancelable: true,
              composed: true,
              cancelable: true,
              detail: e.detail,
            })
          );
        });

        div.appendChild(badge);
      });
    });
  };

  render() {
    this.shadowRoot.innerHTML = `
      <link rel="stylesheet" href="/css/components/calendar.css" />
      <div class="ez-calendar">
        <div class="toolbar">
          <select name="month" class="form-element"></select>
          <input type="number" class="form-element" name="year" placeholder="Year" min="1970" max="2999" value="${this.selectedDate.getFullYear()}" />
          <select name="customer" class="form-element"></select>
        </div>
        <div class="table">
          <div class="thead"></div>
          <div class="tbody"></div>
        </div>
      </div>
    `;

    const calendar = this.shadowRoot.querySelector(".ez-calendar");
    const toolbar = calendar.querySelector(".toolbar");
    const table = calendar.querySelector(".table");
    const tableHead = table.querySelector(".thead");
    const tableBody = table.querySelector(".tbody");
    const monthSelect = toolbar.querySelector("select[name=month]");
    const yearInput = toolbar.querySelector("input[name=year]");
    const customerSelect = toolbar.querySelector("select[name=customer]");
    const weekDayNames = getWeekdayNames(this.lang, "short");

    // Defining local auxiliary functions
    const calculateCalendarDates = () => {
      const weekDay = this.selectedDate.getDay();
      const days = [];

      let firstCalendarDay = new Date(
        new Date(this.selectedDate).setDate(
          this.selectedDate.getDate() - weekDay
        )
      );

      for (let i = 0; i < 42; i++) {
        const dateValue = new Date(
          firstCalendarDay.getFullYear(),
          firstCalendarDay.getMonth(),
          firstCalendarDay.getDate()
        );

        days.push({
          value: dateValue,
          isCurrentDate: compareDates(dateValue, this.currentDate),
          isWeekend: dateValue.getDay() === 0 || dateValue.getDay() === 6,
          isSelectedMonth:
            dateValue.getMonth() === this.selectedDate.getMonth(),
          label: firstCalendarDay.getDate().toString(),
        });

        firstCalendarDay = new Date(
          firstCalendarDay.getFullYear(),
          firstCalendarDay.getMonth(),
          firstCalendarDay.getDate() + 1
        );
      }

      return days;
    };

    const dayClasses = (day) => {
      const classes = ["td"];

      if (day.isCurrentDate) classes.push("current-date");
      if (day.isWeekend) classes.push("weekend");
      if (day.isSelectedMonth) classes.push("current-month clickable");

      return classes;
    };

    // Build the calendar
    const refresh = () => {
      // Build the table head
      tableHead.innerHTML = "";
      weekDayNames.forEach((name) => {
        const div = document.createElement("div");
        div.innerText = name;
        div.classList.add("th");
        tableHead.appendChild(div);
      });

      // Build the table body
      const dates = calculateCalendarDates();

      tableBody.innerHTML = "";
      for (const day of dates) {
        const div = document.createElement("div");
        div.setAttribute("class", dayClasses(day).join(" "));
        div.innerHTML = `<span>${day.label}</span>`;
        div.dataset.date = formatDate(day.value);
        tableBody.appendChild(div);

        // Showing holidays
        if (this.holidaysData.length > 0) {
          const holiday = this.holidaysData.find((row) =>
            compareDates(row.date, day.value)
          );

          if (holiday) {
            const badge = document.createElement("sl-badge");
            badge.innerText = holiday.description;
            badge.type = "info";
            badge.classList.add("holiday");
            div.appendChild(badge);
          }
        }
      }

      // Showing work info
      this.refreshTableData();
    };

    // Build the month select
    const monthNames = getMonthNames(this.lang, "long");

    monthSelect.innerHTML = "";
    monthNames.forEach((name, index) => {
      const option = document.createElement("option");
      option.value = index;
      option.innerText = name;

      if (index === this.currentDate.getMonth()) option.selected = true;

      monthSelect.appendChild(option);
    });

    // Build the year input
    yearInput.value = this.selectedDate.getFullYear();

    // Build the customer select
    customerSelect.innerHTML = "";

    const option = document.createElement("option");
    option.value = "";
    option.disabled = true;
    option.selected = true;
    option.innerText = "-- Please select --";
    customerSelect.appendChild(option);

    this.customerData.forEach((customer) => {
      const option = document.createElement("option");
      option.value = customer.uid;
      option.innerText = customer.name;

      if (customer.uid === this.selectedCustomer?.uid) option.selected = true;

      customerSelect.appendChild(option);
    });

    // Events
    tableBody.addEventListener("click", (e) => {
      const slot = e.target.closest("div.clickable");
      if (!slot) return;

      const date = slot.dataset.date;

      this.dispatchEvent(
        new CustomEvent("dayselect", {
          bubbles: false,
          cancelable: true,
          composed: true,
          detail: {
            day: date,
          },
        })
      );
    });

    monthSelect.addEventListener("change", (e) => {
      this.selectedDate = new Date(
        this.selectedDate.getFullYear(),
        e.target.value,
        1
      );

      refresh();

      this.dispatchEvent(
        new CustomEvent("monthchange", {
          detail: {
            month: e.target.value,
          },
        })
      );
    });

    yearInput.addEventListener("change", (e) => {
      this.selectedDate = new Date(
        e.target.value,
        this.selectedDate.getMonth(),
        1
      );

      refresh();

      this.dispatchEvent(
        new CustomEvent("yearchange", {
          detail: {
            year: e.target.value,
          },
        })
      );
    });

    customerSelect.addEventListener("change", (e) => {
      this.selectedCustomer = this.customerData.find(
        (row) => row.uid === e.target.value
      );

      this.dispatchEvent(
        new CustomEvent("customerchange", {
          detail: {
            customer_uid: e.target.value,
          },
        })
      );
    });

    refresh();
  }

  setCustomerData(customers) {
    this.customerData = customers;
  }

  setCalendarData(calendar) {
    this.data = calendar;
  }

  setHolidaysData(holidays) {
    this.holidaysData = holidays;
  }

  setSelectedDate(date) {
    this.selectedDate = date;
  }
}
