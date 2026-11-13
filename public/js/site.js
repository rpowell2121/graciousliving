// Mobile menu, "More" dropdown, and the contact form. No libraries.
(function () {
  var btn = document.querySelector(".menu-btn");
  var mnav = document.getElementById("mobile-nav");
  function setMenu(open) {
    btn.setAttribute("aria-expanded", String(open));
    mnav.setAttribute("data-open", String(open));
    document.body.style.overflow = open ? "hidden" : "";
  }
  if (btn && mnav) {
    btn.addEventListener("click", function () { setMenu(btn.getAttribute("aria-expanded") !== "true"); });
    var close = mnav.querySelector(".mobile-close");
    if (close) close.addEventListener("click", function () { setMenu(false); });
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

  // Size the Hipaatizer intake form iframe to its content.
  var intake = document.querySelector(".intake-frame");
  if (intake) {
    window.addEventListener("message", function (e) {
      if (e.source === intake.contentWindow && e.data && e.data.glIntakeHeight) {
        intake.style.height = Math.max(400, Math.min(20000, e.data.glIntakeHeight)) + "px";
      }
    });
  }

  // Careers application form.
  var app = document.querySelector("form.apply-form");
  if (app) {
    var fileIn = app.querySelector("input[type=file]");
    var count = app.querySelector(".attach-count");
    var label = app.querySelector(".attach span");
    if (fileIn) fileIn.addEventListener("change", function () {
      var f = fileIn.files[0];
      count.textContent = "Attachments (" + (f ? 1 : 0) + ")";
      label.textContent = f ? f.name : "Attach Resume in PDF or DOCX";
    });
    app.addEventListener("submit", function (e) {
      e.preventDefault();
      var status = app.querySelector(".form-status");
      var submit = app.querySelector("button[type=submit]");
      var fallback = "Sorry, the application form isn't working right now. Please email your information and resume to info@graciouslivingllc.com or call 860-901-2262.";
      submit.disabled = true;
      status.textContent = "Sending...";
      fetch("/api/apply", { method: "POST", body: new FormData(app) })
        .then(function (r) { return r.json().then(function (j) { return { ok: r.ok, status: r.status, j: j }; }); })
        .then(function (res) {
          if (res.ok) {
            app.reset();
            if (count) count.textContent = "Attachments (0)";
            if (label) label.textContent = "Attach Resume in PDF or DOCX";
            status.textContent = "Thank you for applying. Our team will review your application and contact you.";
          } else {
            status.textContent = (res.status === 400 && res.j && res.j.error) ? res.j.error : fallback;
          }
        })
        .catch(function () { status.textContent = fallback; })
        .finally(function () { submit.disabled = false; });
    });
  }
})();
