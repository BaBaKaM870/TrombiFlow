const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "/api";

function buildApiUrl(path) {
  const base = API_BASE.replace(/\/+$/, "");
  const suffix = path.startsWith("/") ? path : `/${path}`;
  return `${base}${suffix}`;
}

function getApiOrigin() {
  try {
    return new URL(API_BASE, window.location.origin).origin;
  } catch {
    return window.location.origin;
  }
}

function makeAssetUrl(path) {
  if (!path) return "";
  if (/^https?:\/\//i.test(path) || path.startsWith("data:") || path.startsWith("blob:")) {
    return path;
  }

  const origin = getApiOrigin();
  if (path.startsWith("/")) {
    return `${origin}${path}`;
  }

  return `${origin}/${path}`;
}

function getToken() {
  return localStorage.getItem("token");
}

async function parseError(response) {
  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    const payload = await response.json();
    return payload?.detail || payload?.error || JSON.stringify(payload);
  }

  return (await response.text()) || `HTTP ${response.status}`;
}

async function request(path, options = {}) {
  const headers = { ...(options.headers || {}) };

  if (options.body && !(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  const token = getToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(buildApiUrl(path), {
    ...options,
    headers,
  });

  if (!response.ok) {
    throw new Error(await parseError(response));
  }

  if (response.status === 204) {
    return null;
  }

  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return response.json();
  }

  return response.text();
}

async function requestResponse(path, options = {}) {
  const headers = { ...(options.headers || {}) };

  if (options.body && !(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  const token = getToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(buildApiUrl(path), {
    ...options,
    headers,
  });

  if (!response.ok) {
    throw new Error(await parseError(response));
  }

  return response;
}

function normalizeClass(cls) {
  return {
    id: cls.id,
    label: cls.label,
    year: cls.year || "",
    createdAt: cls.created_at ?? cls.createdAt ?? "",
  };
}

function normalizeStudent(student) {
  const fallbackPhoto = `https://api.dicebear.com/7.x/personas/svg?seed=${encodeURIComponent(
    `${student.first_name ?? student.firstName ?? "Student"}-${student.last_name ?? student.lastName ?? student.id ?? ""}`
  )}`;

  return {
    id: student.id,
    firstName: student.first_name ?? student.firstName ?? "",
    lastName: student.last_name ?? student.lastName ?? "",
    email: student.email ?? "",
    classId: student.class_id ?? student.classId ?? null,
    classLabel: student.class_label ?? student.classLabel ?? "",
    photo: makeAssetUrl(student.photo_url ?? student.photo ?? "") || fallbackPhoto,
    createdAt: student.created_at ?? student.createdAt ?? "",
  };
}

function normalizeExport(entry) {
  return {
    id: entry.id,
    class: entry.class_label ?? entry.classLabel ?? "—",
    format: (entry.format ?? "").toUpperCase(),
    by: entry.generated_by_name ?? entry.generated_by ?? "—",
    date: entry.created_at ?? entry.createdAt ?? "",
    filePath: entry.file_path ?? entry.filePath ?? null,
  };
}

function normalizeUser(user) {
  return {
    id: user.id,
    username: user.username ?? "",
    email: user.email ?? "",
    role: user.role ?? "teacher",
    photoUrl: makeAssetUrl(user.photo_url ?? user.photoUrl ?? ""),
    createdAt: user.created_at ?? user.createdAt ?? "",
  };
}

export async function login(email, password) {
  const result = await request("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  return { ...result, user: normalizeUser(result.user) };
}

export async function register(payload) {
  return request("/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function registerWithPhoto(formData) {
  return request("/auth/register-with-photo", {
    method: "POST",
    body: formData,
  });
}

export async function getMe() {
  return normalizeUser(await request("/me"));
}

export async function updateCurrentUser(payload) {
  return normalizeUser(
    await request("/auth/me", {
      method: "PUT",
      body: JSON.stringify(payload),
    })
  );
}

export async function uploadCurrentUserPhoto(file) {
  const formData = new FormData();
  formData.append("photo", file);
  return normalizeUser(
    await request("/auth/me/photo", {
      method: "POST",
      body: formData,
    })
  );
}

export async function getStats() {
  return request("/stats");
}

export async function getClasses() {
  const classes = await request("/classes");
  return classes.map(normalizeClass);
}

export async function createClass(payload) {
  return normalizeClass(
    await request("/classes", {
      method: "POST",
      body: JSON.stringify(payload),
    })
  );
}

export async function updateClass(id, payload) {
  return normalizeClass(
    await request(`/classes/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    })
  );
}

export async function deleteClass(id) {
  await request(`/classes/${id}`, {
    method: "DELETE",
  });
}

export async function getStudents(params = {}) {
  const query = new URLSearchParams();
  if (params.classId) query.set("class_id", String(params.classId));
  if (params.q) query.set("q", params.q);

  const suffix = query.toString() ? `?${query.toString()}` : "";
  const students = await request(`/students${suffix}`);
  return students.map(normalizeStudent);
}

export async function createStudent(payload) {
  return normalizeStudent(
    await request("/students", {
      method: "POST",
      body: JSON.stringify(payload),
    })
  );
}

export async function updateStudent(id, payload) {
  return normalizeStudent(
    await request(`/students/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    })
  );
}

export async function deleteStudent(id) {
  await request(`/students/${id}`, {
    method: "DELETE",
  });
}

export async function uploadStudentPhoto(id, file) {
  const formData = new FormData();
  formData.append("photo", file);
  return normalizeStudent(
    await request(`/students/${id}/photo`, {
      method: "POST",
      body: formData,
    })
  );
}

export async function importStudentsCSV(file) {
  const formData = new FormData();
  formData.append("file", file);
  const result = await request("/students/import", {
    method: "POST",
    body: formData,
  });

  return {
    created: result.created ?? 0,
    students: Array.isArray(result.students) ? result.students.map(normalizeStudent) : [],
    errors: result.errors ?? [],
  };
}

export async function getExports() {
  const exportsList = await request("/trombi/exports");
  return exportsList.map(normalizeExport);
}

export async function downloadExport(id) {
  return requestResponse(`/trombi/exports/${id}/download`);
}

export async function generateTrombi(classId, format = "html") {
  const query = new URLSearchParams();
  if (classId) query.set("class_id", String(classId));
  query.set("format", format);

  return requestResponse(`/trombi?${query.toString()}`);
}

export { API_BASE, buildApiUrl, makeAssetUrl };
