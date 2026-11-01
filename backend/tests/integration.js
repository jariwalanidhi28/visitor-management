const http = require("http");
const fs = require("fs");
const path = require("path");

const BASE_URL = "http://localhost:5000";

const makeRequest = (method, urlPath, headers = {}, body = null) => {
  return new Promise((resolve, reject) => {
    const url = new URL(urlPath, BASE_URL);
    const options = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: { ...headers },
    };

    const req = http.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        let parsed = null;
        try {
          parsed = JSON.parse(data);
        } catch (e) {
          parsed = data;
        }
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data: parsed,
        });
      });
    });

    req.on("error", reject);

    if (body) {
      if (typeof body === "string" || Buffer.isBuffer(body)) {
        req.write(body);
      } else {
        req.write(JSON.stringify(body));
      }
    }
    req.end();
  });
};

const makeMultipartRequest = (urlPath, token, fields, fileField, filePath) => {
  return new Promise((resolve, reject) => {
    const boundary = "----WebKitFormBoundary" + Math.random().toString(36).substring(2);
    const url = new URL(urlPath, BASE_URL);

    let body = [];

    // Add text fields
    for (const [key, value] of Object.entries(fields)) {
      body.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="${key}"\r\n\r\n${value}\r\n`));
    }

    // Add file
    if (filePath && fs.existsSync(filePath)) {
      const filename = path.basename(filePath);
      const fileContent = fs.readFileSync(filePath);
      body.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="${fileField}"; filename="${filename}"\r\nContent-Type: image/jpeg\r\n\r\n`));
      body.push(fileContent);
      body.push(Buffer.from("\r\n"));
    }

    body.push(Buffer.from(`--${boundary}--\r\n`));
    const fullBuffer = Buffer.concat(body);

    const options = {
      method: "POST",
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": `multipart/form-data; boundary=${boundary}`,
        "Content-Length": fullBuffer.length,
      },
    };

    const req = http.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        let parsed = null;
        try {
          parsed = JSON.parse(data);
        } catch (e) {
          parsed = data;
        }
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data: parsed,
        });
      });
    });

    req.on("error", reject);
    req.write(fullBuffer);
    req.end();
  });
};

const runTests = async () => {
  console.log("==========================================");
  console.log("RUNNING BACKEND REST API INTEGRATION TESTS");
  console.log("==========================================");

  let passed = 0;
  let total = 0;

  const assert = (condition, testName, details = "") => {
    total++;
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName}: ${details}`);
    }
  };

  try {
    // 1. Health check
    const health = await makeRequest("GET", "/api/health");
    assert(health.status === 200 && health.data.success, "1. Health check endpoint responds OK");

    const dbHealth = await makeRequest("GET", "/api/health/db");
    assert(dbHealth.status === 200 && dbHealth.data.database === "Connected", "2. MongoDB health check confirms connection");

    // 2. Admin Login
    const adminLogin = await makeRequest("POST", "/api/auth/login", { "Content-Type": "application/json" }, {
      email: "admin@visitor.local",
      password: "Admin@123456",
    });
    assert(adminLogin.status === 200 && adminLogin.data.token, "3. Admin logs in and receives JWT", JSON.stringify(adminLogin.data));
    const adminToken = adminLogin.data.token;

    // 3. User Login
    const userLogin = await makeRequest("POST", "/api/auth/login", { "Content-Type": "application/json" }, {
      email: "jariwalanidhi28@gmail.com",
      password: "nidhi123",
    });
    assert(userLogin.status === 200 && userLogin.data.token, "4. Regular user logs in and receives JWT", JSON.stringify(userLogin.data));
    const userToken = userLogin.data.token;

    // 4. Invalid Login
    const invalidLogin = await makeRequest("POST", "/api/auth/login", { "Content-Type": "application/json" }, {
      email: "john@visitor.local",
      password: "WrongPassword999",
    });
    assert(invalidLogin.status === 401, "5. Invalid credentials return 401 Unauthorized");

    // 5. Admin creates a new user
    const uniqueEmpId = `EMP${Date.now().toString().slice(-4)}`;
    const testUserEmail = `test_${Date.now()}@visitor.local`;
    const createUserRes = await makeRequest(
      "POST",
      "/api/admin/users",
      { Authorization: `Bearer ${adminToken}`, "Content-Type": "application/json" },
      {
        name: "Alice Smith",
        employeeId: uniqueEmpId,
        email: testUserEmail,
        mobile: "+91 9123456780",
        department: "Operations",
        designation: "Supervisor",
        password: "Test@123456",
        role: "user",
      }
    );
    assert(createUserRes.status === 201 && createUserRes.data.user.employeeId === uniqueEmpId, "6. Admin successfully creates a new user");

    // 6. Duplicate user rejection
    const dupUserRes = await makeRequest(
      "POST",
      "/api/admin/users",
      { Authorization: `Bearer ${adminToken}`, "Content-Type": "application/json" },
      {
        name: "Duplicate Alice",
        employeeId: uniqueEmpId,
        email: testUserEmail,
        mobile: "+91 9123456780",
        department: "Operations",
        designation: "Supervisor",
        password: "Test@123456",
      }
    );
    assert(dupUserRes.status === 409, "7. Duplicate Employee ID/Email correctly returns 409 Conflict");

    // 7. Non-admin forbidden from admin routes
    const forbiddenRes = await makeRequest(
      "GET",
      "/api/admin/users",
      { Authorization: `Bearer ${userToken}` }
    );
    assert(forbiddenRes.status === 403, "8. Regular user is forbidden from accessing Admin routes (403)");

    // 8. Fetch active destinations
    const destRes = await makeRequest("GET", "/api/destinations", { Authorization: `Bearer ${userToken}` });
    assert(destRes.status === 200 && Array.isArray(destRes.data.destinations), "9. User can fetch active destinations");
    const testDestId = destRes.data.destinations[0]?._id;

    // Create a temporary dummy test image
    const tempDir = path.join(__dirname, "../uploads/temp");
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
    const dummyImagePath = path.join(tempDir, "test-selfie.jpg");
    // Minimal valid 1x1 JPEG buffer
    const minimalJpg = Buffer.from("/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=", "base64");
    fs.writeFileSync(dummyImagePath, minimalJpg);

    // Ensure user has no hanging active check-in before running the test check-in flow
    const activeCheck = await makeRequest("GET", "/api/attendance/my-active", { Authorization: `Bearer ${userToken}` });
    if (activeCheck.data?.hasActive) {
      await makeRequest(
        "POST",
        "/api/attendance/check-out",
        { Authorization: `Bearer ${userToken}`, "Content-Type": "application/json" },
        {
          photoBase64: minimalJpg.toString("base64"),
          latitude: 12.972,
          longitude: 77.595,
          address: "Bangalore",
        }
      );
    }

    // 9. User Check-In with Photo and GPS
    const checkInRes = await makeMultipartRequest(
      "/api/attendance/check-in",
      userToken,
      {
        destinationId: testDestId || "",
        purpose: "Routine Site Inspection",
        remarks: "Testing check-in flow",
        latitude: "12.9716",
        longitude: "77.5946",
        accuracy: "14.2",
        address: "Cyber Gateway, Bangalore",
      },
      "photo",
      dummyImagePath
    );
    assert(checkInRes.status === 201 && checkInRes.data.attendance.status === "checked_in", "10. User check-in succeeds with live photo and GPS", JSON.stringify(checkInRes.data));

    // 10. Duplicate Check-In Rejection
    const dupCheckInRes = await makeMultipartRequest(
      "/api/attendance/check-in",
      userToken,
      {
        destinationId: testDestId || "",
        purpose: "Duplicate Attempt",
        latitude: "12.9716",
        longitude: "77.5946",
      },
      "photo",
      dummyImagePath
    );
    assert(dupCheckInRes.status === 409, "11. Duplicate check-in while already checked in returns 409 Conflict");

    // 11. Check active check-in endpoint
    const activeRes = await makeRequest("GET", "/api/attendance/my-active", { Authorization: `Bearer ${userToken}` });
    assert(activeRes.status === 200 && activeRes.data.hasActive === true, "12. GET /my-active accurately reports active check-in");

    // 12. User Check-Out with Photo and GPS
    const checkOutRes = await makeMultipartRequest(
      "/api/attendance/check-out",
      userToken,
      {
        remarks: "Inspection completed successfully",
        latitude: "12.9720",
        longitude: "77.5950",
        accuracy: "11.0",
        address: "Cyber Gateway Gate 2, Bangalore",
      },
      "photo",
      dummyImagePath
    );
    assert(checkOutRes.status === 200 && checkOutRes.data.attendance.status === "checked_out", "13. User check-out succeeds with live photo, GPS, and calculated duration");

    // 13. Duplicate Check-Out Rejection
    const dupCheckOutRes = await makeMultipartRequest(
      "/api/attendance/check-out",
      userToken,
      {
        latitude: "12.9720",
        longitude: "77.5950",
      },
      "photo",
      dummyImagePath
    );
    assert(dupCheckOutRes.status === 400, "14. Check-out when no active check-in exists returns 400 Bad Request");

    // 14. Admin Attendance Stats
    const statsRes = await makeRequest("GET", "/api/admin/attendance/stats", { Authorization: `Bearer ${adminToken}` });
    assert(statsRes.status === 200 && statsRes.data.stats.totalUsers >= 2, "15. Admin receives aggregated dashboard stats");

    // 15. Admin CSV Export
    const exportRes = await makeRequest("GET", "/api/admin/attendance/export", { Authorization: `Bearer ${adminToken}` });
    assert(exportRes.status === 200 && typeof exportRes.data === "string" && exportRes.data.includes("Employee ID"), "16. Admin CSV export generates formatted CSV report");

    // 16. Authenticated Photo Endpoint
    const photoFilename = checkInRes.data?.attendance?.checkIn?.photoUrl;
    if (photoFilename) {
      const photoRes = await makeRequest("GET", `/api/photos/${photoFilename}`, { Authorization: `Bearer ${adminToken}` });
      assert(photoRes.status === 200, "17. Admin can access uploaded attendance photo securely");

      const unauthorizedPhoto = await makeRequest("GET", `/api/photos/${photoFilename}`);
      assert(unauthorizedPhoto.status === 401, "18. Unauthenticated access to employee photos is blocked (401)");
    }

    console.log("==========================================");
    console.log(`TOTAL TESTS: ${total} | PASSED: ${passed} | FAILED: ${total - passed}`);
    console.log("==========================================");

    // Clean up temp dummy file
    if (fs.existsSync(dummyImagePath)) fs.unlinkSync(dummyImagePath);

    process.exit(total === passed ? 0 : 1);
  } catch (err) {
    console.error("Test execution failed with error:", err);
    process.exit(1);
  }
};

runTests();
