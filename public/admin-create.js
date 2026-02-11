const usersBody = document.getElementById("usersBody");
const listMessage = document.getElementById("listMessage");
const createUserForm = document.getElementById("createUserForm");
const createMessage = document.getElementById("createMessage");
const logoutBtn = document.getElementById("logoutBtn");

async function fetchUsers() {
  listMessage.textContent = "";
  usersBody.innerHTML = "";
  try {
    const res = await fetch("/api/admin/users");
    if (res.status === 401 || res.status === 403) {
      window.location.href = "/login.html";
      return;
    }
    if (!res.ok) {
      listMessage.textContent = "Failed to load users.";
      return;
    }
    const users = await res.json();
    users.forEach(user => {
      const tr = document.createElement("tr");

      const idTd = document.createElement("td");
      idTd.textContent = user.id;

      const usernameTd = document.createElement("td");
      const usernameInput = document.createElement("input");
      usernameInput.value = user.username;
      usernameTd.appendChild(usernameInput);

      const createdTd = document.createElement("td");
      createdTd.textContent = user.created_at ? new Date(user.created_at).toLocaleString() : "";

      const updateTd = document.createElement("td");
      const passwordInput = document.createElement("input");
      passwordInput.type = "password";
      passwordInput.placeholder = "New password (optional)";
      const updateBtn = document.createElement("button");
      updateBtn.className = "action-btn update";
      updateBtn.textContent = "Update";
      updateBtn.addEventListener("click", async () => {
        const payload = {};
        if (usernameInput.value.trim()) {
          payload.username = usernameInput.value.trim();
        }
        if (passwordInput.value.trim()) {
          payload.password = passwordInput.value.trim();
        }
        if (!payload.username && !payload.password) return;

        const res = await fetch(`/api/admin/users/${user.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        if (!res.ok) {
          alert("Failed to update user");
          return;
        }
        passwordInput.value = "";
        fetchUsers();
      });
      updateTd.appendChild(passwordInput);
      updateTd.appendChild(updateBtn);

      const deleteTd = document.createElement("td");
      const deleteBtn = document.createElement("button");
      deleteBtn.className = "action-btn delete";
      deleteBtn.textContent = "Delete";
      deleteBtn.addEventListener("click", async () => {
        if (!confirm("Delete this user?")) return;
        const res = await fetch(`/api/admin/users/${user.id}`, {
          method: "DELETE"
        });
        if (!res.ok) {
          alert("Failed to delete user");
          return;
        }
        fetchUsers();
      });
      deleteTd.appendChild(deleteBtn);

      tr.appendChild(idTd);
      tr.appendChild(usernameTd);
      tr.appendChild(createdTd);
      tr.appendChild(updateTd);
      tr.appendChild(deleteTd);
      usersBody.appendChild(tr);
    });
  } catch (error) {
    listMessage.textContent = "Failed to load users.";
  }
}

createUserForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  createMessage.textContent = "";

  const username = document.getElementById("newUsername").value.trim();
  const password = document.getElementById("newPassword").value.trim();
  if (!username || !password) {
    createMessage.textContent = "Username and password required.";
    return;
  }

  const res = await fetch("/api/admin/users", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password })
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    createMessage.textContent = data.error || "Failed to create user.";
    return;
  }

  createUserForm.reset();
  fetchUsers();
});

if (logoutBtn) {
  logoutBtn.addEventListener("click", async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      window.location.href = "/login.html";
    }
  });
}

fetchUsers();
