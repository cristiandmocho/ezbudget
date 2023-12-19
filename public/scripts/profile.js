import { formatDate, showToast, showConfirmDialog } from "./utils/utilities.js";

(async () => {
  const Tenant = {
    Profile: {},
    Prefs: {},
    isModified: false,
  };

  // Auxiliary functions
  async function loadTenant() {
    try {
      Tenant.Profile = await fetch("/api/tenant")
        .catch((err) => {
          throw new Error(err.message);
        })
        .then((res) => res.json());

      Tenant.Prefs = JSON.parse(Tenant.Profile.preferences);

      // Fill in the form
      Object.keys(Tenant.Profile).forEach((key) => {
        const el = document.querySelector(`[name=${key}]`);

        if (el) {
          if (key === "created") {
            el.value = formatDate(Tenant.Profile[key]);
            Tenant.Profile[key] = el.value;
          } else {
            el.value = Tenant.Profile[key];
          }
        }
      });

      Object.keys(Tenant.Prefs).forEach((key) => {
        const el = document.querySelector(`[name=${key}]`);

        if (el) {
          el.value = Tenant.Prefs[key];
        }
      });
    } catch (e) {
      showToast(
        `Failed to load profile. ${e.message}`,
        "Error",
        "danger",
        "cancel"
      );
    }
  }

  async function saveTenant() {
    try {
      const data = { ...Tenant.Profile };
      data.preferences = JSON.stringify(Tenant.Prefs);

      delete data.auth0_uid; // Don't want to update this

      fetch("/api/tenant", {
        method: "PATCH",
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json" },
      })
        .catch((err) => {
          throw new Error(err.message);
        })
        .then(() => {
          showToast(
            `Profile successfully updated`,
            "Success",
            "success",
            "check"
          );

          Tenant.isModified = false;
        });
    } catch (err) {
      showToast(
        `Failed to save profile. ${err.message}`,
        "Error",
        "danger",
        "cancel"
      );
    }
  }

  async function deleteTenant() {
    try {
      fetch(`/api/tenant`, { method: "DELETE" })
        .catch((err) => {
          throw new Error(err.message);
        })
        .then(() => {
          showToast(
            `Customer successfully deleted`,
            "Success",
            "success",
            "check"
          );
        });
    } catch (err) {
      showToast(
        `Failed to delete customer ${uid}. ${err.message}`,
        "Error",
        "danger",
        "cancel"
      );
    }
  }

  // Event handlers
  function onButtonClick(e) {
    const btn = e.target.closest("sl-button");

    if (!btn) return;

    const name = btn.getAttribute("name");

    switch (name) {
      case "btnCancel":
        history.back();
        break;

      case "btnDelete": {
        const confirm = showConfirmDialog({
          title: "Delete Profile",
          message:
            "This action will DESTROY ALL OF YOUR DATA PERMANENTLY and remove you from our system. Are you sure you want to continue with this action?",
        });

        confirm.addEventListener("confirm", () => {
          deleteTenant(Tenant.Profile.uid);
        });

        break;
      }

      case "btnSave":
        saveTenant();
        break;
    }
  }

  function onInputChange(e) {
    const el = e.target;
    const name = el.getAttribute("name");
    const value = el.value;

    if (name in Tenant.Prefs) {
      if (Tenant.Prefs[name] !== value) {
        Tenant.Prefs[name] = value;
        Tenant.isModified = true;
      }
      return;
    } else {
      if (Tenant.Profile[name] !== value) {
        Tenant.Profile[name] = value;
        Tenant.isModified = true;
      }
    }
  }

  // Initializing
  loadTenant();

  // DOM Events
  document.querySelector("form").addEventListener("change", onInputChange);
  document.querySelector(".buttons").addEventListener("click", onButtonClick);
})();
