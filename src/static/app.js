document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";
      // Clear any existing select options except the placeholder
      // Keep the first option (placeholder) and remove others
      while (activitySelect.options.length > 1) {
        activitySelect.remove(1);
      }

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        // Basic card content
        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          <div class="participants">
            <h5>Participants</h5>
            <ul class="participants-list" style="list-style: none; padding-left: 0;"></ul>
          </div>
        `;

        // Populate participants list (bulleted with pretty pills)
        const participantsList = activityCard.querySelector(".participants-list");
        if (Array.isArray(details.participants) && details.participants.length > 0) {
          details.participants.forEach((p) => {
            const li = document.createElement("li");
            li.style.display = "flex";
            li.style.alignItems = "center";
            li.style.gap = "8px";
            const span = document.createElement("span");
            span.className = "participant-name";
            const displayName =
              (typeof p === "object" && p !== null && (p.name || p.email)) ?
                (p.name || p.email) :
                String(p);
            span.textContent = displayName;
            li.appendChild(span);
            // Add delete icon
            const deleteBtn = document.createElement("button");
            deleteBtn.className = "delete-participant";
            deleteBtn.innerHTML = "&#128465;"; // Trash can icon
            deleteBtn.title = "Remove participant";
            deleteBtn.style.background = "none";
            deleteBtn.style.border = "none";
            deleteBtn.style.cursor = "pointer";
            deleteBtn.style.color = "#d32f2f";
            deleteBtn.style.fontSize = "1.1em";
            deleteBtn.addEventListener("click", async (e) => {
              e.stopPropagation();
              // Unregister participant logic
              try {
                const participantId = (typeof p === "object" && p !== null && p.email) ? p.email : p;
                const res = await fetch(
                  `/activities/${encodeURIComponent(name)}/unregister?email=${encodeURIComponent(participantId)}`,
                  { method: "POST" }
                );
                if (res.ok) {
                  await fetchActivities();
                } else {
                  alert("Failed to remove participant.");
                }
              } catch (err) {
                alert("Error removing participant.");
              }
            });
            li.appendChild(deleteBtn);
            participantsList.appendChild(li);
          });
        } else {
          const emptyLi = document.createElement("li");
          emptyLi.className = "participants-empty";
          emptyLi.textContent = "No participants yet.";
          participantsList.appendChild(emptyLi);
        }

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        // Refresh activities list after successful registration
        await fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
