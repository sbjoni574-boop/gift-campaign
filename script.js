const form1 =
  document.getElementById("form1");

const form2 =
  document.getElementById("form2");

const success =
  document.getElementById("success");

const backBtn =
  document.getElementById("backBtn");

const entryIdElement =
  document.getElementById("entryId");


let currentEntryId = null;


// ====================================
// FORM 1 → CONTINUE
// ====================================

form1.addEventListener(
  "submit",
  async function(event) {

    event.preventDefault();


    const name =
      document
        .getElementById("name")
        .value
        .trim();


    const email =
      document
        .getElementById("email")
        .value
        .trim();


    const mobile =
      document
        .getElementById("mobile")
        .value
        .trim();


    const dob =
      document
        .getElementById("dob")
        .value;


    const district =
      document
        .getElementById("district")
        .value;


    // -----------------------------
    // Validation
    // -----------------------------

    if (
      !name ||
      !email ||
      !mobile ||
      !dob ||
      !district
    ) {

      alert(
        "Please fill all fields."
      );

      return;
    }


    if (!/^[0-9]{10}$/.test(mobile)) {

      alert(
        "Please enter a valid 10 digit mobile number."
      );

      return;
    }


    try {

      const response =
        await fetch(
          "/api/register",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json"
            },

            body: JSON.stringify({

              name,
              email,
              mobile,
              dob,
              district

            })

          }
        );


      const result =
        await response.json();


      if (
        !response.ok ||
        !result.success
      ) {

        alert(
          result.message ||
          "Registration failed."
        );

        return;
      }


      currentEntryId =
        result.entryId;


      form1
        .classList
        .add("hidden");


      form2
        .classList
        .remove("hidden");

    }

    catch (error) {

      console.error(
        "Registration error:",
        error
      );

      alert(
        "Server se connection nahi ho raha."
      );

    }

  }
);


// ====================================
// BACK
// ====================================

backBtn.addEventListener(
  "click",
  function() {

    form2
      .classList
      .add("hidden");


    form1
      .classList
      .remove("hidden");

  }
);


// ====================================
// FORM 2 → COUPON SUBMIT
// ====================================

form2.addEventListener(
  "submit",
  async function(event) {

    event.preventDefault();


    const secretCode =
      document
        .getElementById("secretCode")
        .value
        .trim();


    // 6–8 digit coupon only
    if (
      !/^[0-9]{6,8}$/.test(secretCode)
    ) {

      alert(
        "Coupon code must contain 6 to 8 digits."
      );

      return;
    }


    if (!currentEntryId) {

      alert(
        "Entry ID missing. Please start again."
      );

      return;
    }


    try {

      const response =
        await fetch(
          "/api/secret",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json"
            },

            body: JSON.stringify({

              entryId:
                currentEntryId,

              secretCode:
                secretCode

            })

          }
        );


      const result =
        await response.json();


      if (
        !response.ok ||
        !result.success
      ) {

        alert(
          result.message ||
          "Submission failed."
        );

        return;
      }


      entryIdElement
        .textContent =
          currentEntryId;


      form2
        .classList
        .add("hidden");


      success
        .classList
        .remove("hidden");

    }

    catch (error) {

      console.error(
        "Coupon error:",
        error
      );

      alert(
        "Server se connection nahi ho raha."
      );

    }

  }
);
