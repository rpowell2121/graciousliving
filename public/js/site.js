// Mobile menu, "More" dropdown, and the contact form. No libraries.
(function () {
  var btn = document.querySelector(".menu-btn");
  var mnav = document.getElementById("mobile-nav");
  if (btn && mnav) {
    btn.addEventListener("click", function () {
      var open = btn.getAttribute("aria-expanded") === "true";
      btn.setAttribute("aria-expanded", String(!open));
      mnav.setAttribute("data-open", String(!open));
    });
  }

  // Close the desktop "More" menu when clicking elsewhere or pressing Escape.
  var more = document.querySelector(".nav details");
  if (more) {
    document.addEventListener("click", function (e) { if (!more.contains(e.target)) more.removeAttribute("open"); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") more.removeAttribute("open"); });
  }

  var form = document.querySelector("form.contact-form");
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var status = form.querySelector(".form-status");
      var submit = form.querySelector("button[type=submit]");
      var data = Object.fromEntries(new FormData(form));
      data.page = location.pathname;
      submit.disabled = true;
      status.textContent = "Sending...";
      fetch("/api/contact", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(data) })
        .then(function (r) { return r.json().then(function (j) { return { ok: r.ok, j: j }; }); })
        .then(function (res) {
          if (res.ok) {
            form.reset();
            status.textContent = "Thank you. We received your message and will be in touch within one business day.";
          } else {
            status.textContent = (res.j && res.j.error === "Please enter a valid email")
              ? res.j.error
              : "Sorry, the form isn't working right now. Please call us at 860-901-2262 or email info@graciouslivingllc.com.";
          }
        })
        .catch(function () {
          status.textContent = "Sorry, the form isn't working right now. Please call us at 860-901-2262 or email info@graciouslivingllc.com.";
        })
        .finally(function () { submit.disabled = false; });
    });
  }
})();
