const form1 = document.getElementById("form1");
const form2 = document.getElementById("form2");
const success = document.getElementById("success");

const backBtn = document.getElementById("backBtn");
const entryIdElement = document.getElementById("entryId");

let currentEntryId = null;


// ============================
// FORM 1 → CONTINUE
// ============================

form1.addEventListener("submit", async function (event) {
  event.preventDefault();

  const name = document.getElementById("name").value.trim();
  const mobile = document.getElementById("mobile").value.trim();
  const dob = document.getElementById("dob").value;
  const district = document.getElementById("district").value;

  if (!name || !mobile || !dob || !district) {
    alert("Please fill all fields.");
    return;
  }

  try {
    const response = await fetch("/api/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        name,
        mobile,
        dob,
        district
      })
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      alert(result.message || "Registration failed.");
      return;
    }

    currentEntryId = result.entryId;

    form1.classList.add("hidden");
    form2.classList.remove("hidden");

  } catch (error) {
    console.error("Form 1 error:", error);

    alert(
      "Server se connection nahi ho raha. Please try again."
    );
  }
});


// ============================
// BACK BUTTON
// ============================

backBtn.addEventListener("click", function () {
  form2.classList.add("hidden");
  form1.classList.remove("hidden");
});


// ============================
// FORM 2 → SUBMIT
// ============================

form2.addEventListener("submit", async function (event) {
  event.preventDefault();

  const secretCode =
    document.getElementById("secretCode").value.trim();

  if (!secretCode) {
    alert("Please enter the campaign Secret Code.");
    return;
  }

  if (!currentEntryId) {
    alert("Entry ID missing. Please start again.");
    return;
  }

  try {

    // IMPORTANT:
    // server.js endpoint is /api/secret
    const response = await fetch("/api/secret", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        entryId: currentEntryId,
        secretCode: secretCode
      })
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      alert(result.message || "Submission failed.");
      return;
    }

    entryIdElement.textContent = currentEntryId;

    form2.classList.add("hidden");
    success.classList.remove("hidden");

  } catch (error) {
    console.error("Form 2 error:", error);

    alert(
      "Server se connection nahi ho raha. Please try again."
    );
  }
});
