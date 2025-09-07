const API_BASE = "";

// Show message function
function showMessage(message, type = "success") {
  const messageDiv = document.getElementById("message");
  messageDiv.textContent = message;
  messageDiv.className = type;
  messageDiv.style.display = "block";
  setTimeout(() => {
    messageDiv.style.display = "none";
  }, 8100);
}

// Create User
document.getElementById("createForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const formData = {
    name: document.getElementById("name").value,
    email: document.getElementById("email").value,
    age: parseInt(document.getElementById("age").value),
  };

  try {
    const response = await fetch(`${API_BASE}/users`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formData),
    });

    if (response.ok) {
      const result = await response.json();
      showMessage(`User created successfully! ID: ${result.id}`, "success");
      document.getElementById("createForm").reset();
      loadUsers(); // Refresh the user list
    } else {
      const error = await response.json();
      showMessage(`Error: ${error.detail}`, "error");
    }
  } catch (error) {
    showMessage(`Network error: ${error.message}`, "error");
  }
});

// Load All Users
async function loadUsers() {
  try {
    const response = await fetch(`${API_BASE}/users`);
    const users = await response.json();

    const usersList = document.getElementById("usersList");
    if (users.length === 0) {
      usersList.innerHTML = "<p>No users found.</p>";
    } else {
      usersList.innerHTML = users
        .map(
          (user) => `
                <div class="user-item">
                    <strong>ID:</strong> ${user.id}<br>
                    <strong>Name:</strong> ${user.name}<br>
                    <strong>Email:</strong> ${user.email}<br>
                    <strong>Age:</strong> ${user.age}<br>
                    <strong>Created:</strong> ${new Date(
                      user.created_at
                    ).toLocaleString()}
                </div>
            `
        )
        .join("");
    }
  } catch (error) {
    showMessage(`Error loading users: ${error.message}`, "error");
  }
}

document.getElementById("loadUsers").addEventListener("click", loadUsers);

// Update User
document.getElementById("updateForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const userId = document.getElementById("updateId").value;
  const updateData = {};

  const name = document.getElementById("updateName").value;
  const email = document.getElementById("updateEmail").value;
  const age = document.getElementById("updateAge").value;

  if (name) updateData.name = name;
  if (email) updateData.email = email;
  if (age) updateData.age = parseInt(age);

  try {
    const response = await fetch(`${API_BASE}/users/${userId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updateData),
    });

    if (response.ok) {
      const result = await response.json();
      showMessage(`User updated successfully!`, "success");
      document.getElementById("updateForm").reset();
      loadUsers(); // Refresh the user list
    } else {
      const error = await response.json();
      showMessage(`Error: ${error.detail}`, "error");
    }
  } catch (error) {
    showMessage(`Network error: ${error.message}`, "error");
  }
});

// Delete User
document.getElementById("deleteForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const userId = document.getElementById("deleteId").value;

  try {
    const response = await fetch(`${API_BASE}/users/${userId}`, {
      method: "DELETE",
    });

    if (response.ok) {
      const result = await response.json();
      showMessage(result.message, "success");
      document.getElementById("deleteForm").reset();
      loadUsers(); // Refresh the user list
    } else {
      const error = await response.json();
      showMessage(`Error: ${error.detail}`, "error");
    }
  } catch (error) {
    showMessage(`Network error: ${error.message}`, "error");
  }
});

// Load users when page loads
window.addEventListener("load", loadUsers);
