for (const form of document.querySelectorAll("form.inquiry-form")) {
form.addEventListener("submit", (event) => {
event.preventDefault();
const fields = [...new FormData(form).entries()]
.filter(([name]) => !name.startsWith("sms_consent"))
.map(([name, value]) => `${name.replaceAll("_", " ")}: ${value}`)
.join("\n");
const subject = `3C Mortgage Group website inquiry — ${document.title}`;
window.location.href = `mailto:sergio@3cmortgagegroup.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(fields)}`;
});
}