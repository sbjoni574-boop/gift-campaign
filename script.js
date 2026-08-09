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

    if (!response.ok) {
      alert(result.message || "Registration failed.");
      return;
    }

    // Entry ID ko temporarily remember karenge
    currentEntryId = result.entryId;

    // Form 1 hide
    form1.classList.add("hidden");

    // Form 2 show
    form2.classList.remove("hidden");

  } catch (error) {

    console.error(error);

    alert(
      "Server se connection nahi ho raha. Please check that the server is running."
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

    const response = await fetch("/api/secret-code", {

      method: "POST",

      headers: {
        "Content-Type": "application/json"
      },

      body: JSON.stringify({
        entryId: currentEntryId,
        secretCode
      })

    });

    const result = await response.json();

    if (!response.ok) {
      alert(result.message || "Submission failed.");
      return;
    }

    // Entry ID show
    entryIdElement.textContent = currentEntryId;

    // Form 2 hide
    form2.classList.add("hidden");

    // Success page show
    success.classList.remove("hidden");

  } catch (error) {

    console.error(error);

    alert(
      "Server se connection nahi ho raha. Please check that the server is running."
    );

  }

});