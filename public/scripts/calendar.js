import { compareDates, formatDate, showToast } from "./utils/utilities.js";

(async () => {
  const currentDate = new Date();
  const $calendar = document.querySelector("ez-calendar");
  const lang = $calendar.getAttribute("lang").split("-").pop();

  let calendarData = [],
    holidaysData = [],
    customersData = [],
    selectedCustomer = null;

  const slotFind = (data) => (row) =>
    compareDates(row.work_date, data.slot) &&
    row.customer_uid === data.customer;

  const slotFilter = (data) => (row) =>
    !(
      compareDates(row.work_date, data.slot) &&
      row.customer_uid === data.customer
    );

  function addCalendarEvent(data) {
    if (calendarData.find(slotFind(data)) != null) return;

    // Does not exist, insert
    const slotInfo = {
      work_date: new Date(data.slot),
      customer_uid: data.customer,
      name: selectedCustomer.name,
      color: selectedCustomer.color,
      type: selectedCustomer.type,
    };

    calendarData.push(slotInfo);

    $calendar.setCalendarData(calendarData);
    $calendar.refreshTableData();

    fetch("/api/calendar", {
      method: "POST",
      body: JSON.stringify({
        day: formatDate(data.slot),
        customer: data.customer,
      }),
      headers: { "Content-Type": "application/json" },
    }).catch((err) => {
      showToast(err.message, "Error", "danger", "cancel");
    });
  }

  function removeCalendarEvent(data) {
    calendarData = calendarData.filter(slotFilter(data));
    $calendar.setCalendarData(calendarData);
    $calendar.refreshTableData();

    const body = JSON.stringify({
      day: formatDate(data.slot),
      customer: data.customer,
    });

    fetch("/api/calendar", {
      method: "DELETE",
      body,
      headers: { "Content-Type": "application/json" },
    }).catch((err) => {
      showToast(err.message, "Error", "danger", "cancel");
    });
  }

  async function loadCalendarData(month, year) {
    calendarData = await fetch(
      `/api/calendar?month=${month}&year=${year}`
    ).then((data) => data.json());
    calendarData = calendarData.map((row) => ({
      ...row,
      work_date: new Date(row.work_date),
    }));
  }

  async function loadHolidaysData(year) {
    holidaysData = await fetch(`/api/holidays?year=${year}&lang=${lang}`)
      .catch((err) => {
        console.log(err);
      })
      .then((data) => data.json());
    holidaysData = holidaysData.map((row) => ({
      ...row,
      date: new Date(row.date),
    }));
  }

  async function loadCustomers() {
    customersData = await fetch("/api/customers").then((data) => data.json());
  }

  // Event handlers
  function onBadgeClickHandler(e) {
    e.stopPropagation();

    const { date, customer_uid } = e.detail;

    if (!customer_uid) {
      showToast("This slot is missing the customer info!");
      return;
    }

    removeCalendarEvent({ slot: date, customer: customer_uid });
  }

  function onDaySelectHandler(e) {
    if (!selectedCustomer) {
      showToast("Select a customer first!");
      return;
    }

    const data = {
      slot: new Date(e.detail.day),
      customer: selectedCustomer.uid,
    };
    addCalendarEvent(data);
  }

  function onMonthChangeHandler(e) {
    console.log(e.detail.month);
  }

  function onYearChangeHandler(e) {
    console.log(e.detail.year);
  }

  function onCustomerChangeHandler(e) {
    selectedCustomer = customersData.find(
      (row) => row.uid === e.detail.customer_uid
    );
  }

  // DOM Events
  $calendar.addEventListener("badgeclick", onBadgeClickHandler);
  $calendar.addEventListener("dayselect", onDaySelectHandler);
  $calendar.addEventListener("monthchange", onMonthChangeHandler);
  $calendar.addEventListener("yearchange", onYearChangeHandler);
  $calendar.addEventListener("customerchange", onCustomerChangeHandler);

  // Initializing
  await loadCustomers();
  await loadCalendarData(currentDate.getMonth() + 1, currentDate.getFullYear());
  await loadHolidaysData(currentDate.getFullYear());

  $calendar.setCustomerData(customersData);
  $calendar.setHolidaysData(holidaysData || []);
  $calendar.setCalendarData(calendarData || []);
  $calendar.render();
})();
