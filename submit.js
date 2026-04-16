const ENDPOINT_URL = "";

const form = document.getElementById("submission-form");
const statusEl = document.getElementById("submit-status");
const switchItemsEl = document.getElementById("switch-items");

function buildSwitchRows() {
  if (!switchItemsEl) {
    return [];
  }

  const items = [];
  const negativeItems = document.querySelectorAll(".negative-panel li");
  const positiveItems = document.querySelectorAll(".positive-panel li");
  const allItems = [
    ...Array.from(negativeItems).map((el) => ({ category: "Negative", text: el.textContent.trim() })),
    ...Array.from(positiveItems).map((el) => ({ category: "Positive", text: el.textContent.trim() }))
  ];

  switchItemsEl.innerHTML = "";
  allItems.forEach((item, index) => {
    const key = `${item.category.toLowerCase()}-${index + 1}`;
    const row = document.createElement("div");
    row.className = "switch-row";

    const text = document.createElement("div");
    text.className = "switch-text";
    text.textContent = `${item.category} ${index + 1}: ${item.text}`;

    const toggle = document.createElement("label");
    toggle.className = "toggle";

    const input = document.createElement("input");
    input.type = "checkbox";
    input.name = key;
    input.setAttribute("aria-label", `${item.category} item ${index + 1}`);

    const slider = document.createElement("span");
    slider.className = "toggle-slider";

    toggle.appendChild(input);
    toggle.appendChild(slider);

    row.appendChild(text);
    row.appendChild(toggle);
    switchItemsEl.appendChild(row);

    items.push({ key, category: item.category, text: item.text, input });
  });

  return items;
}

const switchItems = buildSwitchRows();

if (form && statusEl) {
  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const submitButton = form.querySelector('button[type="submit"]');
    const feedback = (form.feedback.value || "").trim();

    if (!ENDPOINT_URL) {
      statusEl.textContent = "Form is not configured yet. Add your serverless URL in submit.js.";
      return;
    }

    if (!feedback) {
      statusEl.textContent = "Please add brief feedback before sending.";
      return;
    }

    const itemStates = switchItems.map((item) => ({
      key: item.key,
      category: item.category,
      statement: item.text,
      value: item.input.checked
    }));

    submitButton.disabled = true;
    statusEl.textContent = "Sending...";

    try {
      const response = await fetch(ENDPOINT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ feedback, itemStates })
      });

      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(result.error || "Request failed");
      }

      form.reset();
      statusEl.textContent = "Saved successfully. A new file was committed to the repo.";
    } catch (error) {
      statusEl.textContent = `Could not save: ${error.message}`;
    } finally {
      submitButton.disabled = false;
    }
  });
}
