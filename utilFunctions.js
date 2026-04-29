import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import readline from "node:readline";
import chalk from "chalk";
import { logger } from "./logger.js";
import { createSpinner } from "./spinner.js";

export async function fetchResponse(
  method = "GET",
  urlPath,
  body = "",
  showSpinner = true,
) {
  const credentials = await readCredentials();

  const spinner = showSpinner ? createSpinner("Fetching data...") : null;
  if (spinner) spinner.start();

  const API_URL = "https://ubiquitous-chainsaw-production-5f71.up.railway.app";

  let option = {
    method: method,
    headers: {
      "x-api-version": "1",
      Cookie: `access_token=${credentials.access_token}`,
    },
  };

  if (method === "POST") {
    option.body = body ? JSON.stringify(body) : "";
    option.headers["Content-Type"] = "application/json";
  }

  try {
    const response = await fetch(`${API_URL}${urlPath}`, option);

    const contentType = response.headers.get("content-type");
    if (!response.ok) {
      if (contentType && contentType.includes("application/json")) {
        const responseObj = await response.json();
        if (responseObj.message === "Access Token has expired") {
          if (spinner) spinner.update("Refreshing authentication...");
          // Refresh token and retry the request
          try {
            await refreshCredentials(credentials);
            if (spinner) spinner.stop();
            return await fetchResponse(
              method,
              `${API_URL}${urlPath}`,
              body,
              false,
            ); // Don't show spinner on retry
          } catch (refreshErr) {
            if (spinner) spinner.stop();
            if (refreshErr.message === "REFRESH_TOKEN_EXPIRED") {
              logger.warning(
                `Refresh token has expired. Run 'insighta login' to login again.`,
              );
            } else {
              logger.error("Refresh failed:", refreshErr.message);
            }
            return;
          }
        }

        if (spinner) spinner.fail("Request failed");
        logger.error(
          `HTTP error! status: ${response.status} message: ${responseObj.message}`,
        );
        return;
      } else {
        const text = await response.text();
        if (spinner) spinner.fail("Request failed");
        logger.error(
          `HTTP error! status: ${response.status}, received HTML instead of JSON`,
        );
        logger.debug("Response:", text.substring(0, 200));
        return;
      }
    }

    if (contentType && contentType.includes("text/csv")) {
      const contentDisposition = response.headers.get("content-disposition");
      let filename = `profiles_${new Date().toISOString().split("T")[0]}.csv`; // fallback

      // Extract filename from Content-Disposition header
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }

      if (spinner) spinner.succeed("Data fetched successfully");

      return {
        data: await response.text(),
        filename: filename,
      };
    }

    const data = await response.json();
    if (spinner) spinner.succeed("Data fetched successfully");
    return data;
  } catch (err) {
    if (spinner) spinner.fail("Fetch failed");
    logger.error("Fetch failed:", err.message);
    throw err;
  }
}

export async function readCredentials() {
  const folderPath = path.join(os.homedir(), ".insighta");
  const filePath = path.join(folderPath, "credentials.json");

  try {
    await fs.access(filePath);
  } catch {
    logger.error("No credentials found. Run 'insighta login' to log in.");
    process.exit(1);
  }

  const content = await fs.readFile(filePath, { encoding: "utf-8" });
  return JSON.parse(content);
}

async function writeCredentials(newCredentials) {
  const oldCredentials = await readCredentials();
  const filePath = path.join(os.homedir(), ".insighta", "credentials.json");
  const credentials = {
    username: oldCredentials.username,
    access_token: newCredentials.access_token,
    refresh_token: newCredentials.refresh_token,
  };

  await fs.writeFile(filePath, JSON.stringify(credentials, null, 2), {
    encoding: "utf-8",
  }); // ← Add JSON.stringify

  return newCredentials;
}

async function refreshCredentials(oldCredentials) {
  const credentialsResponse = await fetch(
    `https://ubiquitous-chainsaw-production-5f71.up.railway.app/auth/refresh`,
    {
      method: "POST",
      headers: {
        "x-api-version": "1",
        Cookie: `access_token=${oldCredentials.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refresh_token: oldCredentials.refresh_token }),
    },
  );

  const newCredentialsObj = await credentialsResponse.json();
  if (!credentialsResponse.ok) {
    if (newCredentialsObj.status !== "success") {
      if (newCredentialsObj.message === "Refresh Token has expired") {
        throw new Error("REFRESH_TOKEN_EXPIRED");
      }

      throw new Error(
        `Refresh failed with status: ${credentialsResponse.status}`,
      );
    }

    throw new Error(`Refresh failed: ${credentialsResponse.status}`);
  }

  const newCredentials = await writeCredentials(newCredentialsObj);
  return newCredentials;
}

/**
 * Format data as a bordered table with rainbow-colored columns
 * @param {Object|Array} data - Single object or array of objects to display
 */
export function formatTable(data) {
  if (!data) {
    console.log(chalk.yellow("No data to display"));
    return;
  }

  // Convert single object to array for uniform handling
  const rows = Array.isArray(data) ? data : [data];

  if (rows.length === 0) {
    console.log(chalk.yellow("No data to display"));
    return;
  }

  // Get headers from first object
  const headers = Object.keys(rows[0]);

  // Rainbow colors for columns
  const colors = [
    chalk.cyan,
    chalk.green,
    chalk.yellow,
    chalk.blue,
    chalk.magenta,
    chalk.red,
    chalk.cyanBright,
    chalk.greenBright,
    chalk.yellowBright,
    chalk.blueBright,
    chalk.magentaBright,
    chalk.redBright,
  ];

  // Fixed column widths based on header names (with padding)
  const columnWidths = headers.map((header) => {
    const name = header.toLowerCase();
    if (name === "id") return 38;
    if (name.includes("name")) return 20;
    if (name.includes("probability")) return 22;
    if (name.includes("created")) return 28;
    if (name.includes("country_id")) return 14;
    if (name.includes("age_group")) return 13;
    return 12; // default width
  });

  // Wrap text to fit within column width
  const wrapText = (text, width) => {
    const str = String(text ?? "");
    const actualWidth = width - 2; // Account for padding

    if (str.length <= actualWidth) {
      return [str];
    }

    const lines = [];
    let remaining = str;

    while (remaining.length > 0) {
      if (remaining.length <= actualWidth) {
        lines.push(remaining);
        break;
      }

      // Find last space within width
      let breakPoint = remaining.lastIndexOf(" ", actualWidth);

      if (breakPoint === -1 || breakPoint === 0) {
        // No space found, force break
        breakPoint = actualWidth;
      }

      lines.push(remaining.substring(0, breakPoint));
      remaining = remaining.substring(breakPoint).trim();
    }

    return lines;
  };

  // Helper to pad text
  const pad = (text, width) => {
    const str = String(text ?? "");
    return str + " ".repeat(Math.max(0, width - str.length));
  };

  // Box drawing characters
  const border = {
    topLeft: "┌",
    topRight: "┐",
    bottomLeft: "└",
    bottomRight: "┘",
    horizontal: "─",
    vertical: "│",
    cross: "┼",
    topJoin: "┬",
    bottomJoin: "┴",
    leftJoin: "├",
    rightJoin: "┤",
  };

  // Print top border
  const topBorder =
    border.topLeft +
    columnWidths.map((w) => border.horizontal.repeat(w)).join(border.topJoin) +
    border.topRight;
  console.log(chalk.gray(topBorder));

  // Print header row with colors (wrapped if needed)
  const headerLines = headers.map((header, i) =>
    wrapText(header.toUpperCase(), columnWidths[i]),
  );
  const maxHeaderLines = Math.max(...headerLines.map((lines) => lines.length));

  for (let lineIdx = 0; lineIdx < maxHeaderLines; lineIdx++) {
    const headerRow =
      border.vertical +
      headerLines
        .map((lines, i) => {
          const color = colors[i % colors.length];
          const text = lines[lineIdx] || "";
          return color.bold(pad(text, columnWidths[i]));
        })
        .join(chalk.gray(border.vertical)) +
      chalk.gray(border.vertical);
    console.log(headerRow);
  }

  // Print header separator
  const headerSeparator =
    border.leftJoin +
    columnWidths.map((w) => border.horizontal.repeat(w)).join(border.cross) +
    border.rightJoin;
  console.log(chalk.gray(headerSeparator));

  // Print data rows with rainbow colors and wrapping
  rows.forEach((row, _rowIdx) => {
    // Wrap all cell contents
    const wrappedCells = headers.map((header, i) =>
      wrapText(row[header], columnWidths[i]),
    );

    const maxLines = Math.max(...wrappedCells.map((lines) => lines.length));

    // Print each line of the wrapped row
    for (let lineIdx = 0; lineIdx < maxLines; lineIdx++) {
      const rowText =
        border.vertical +
        wrappedCells
          .map((lines, i) => {
            const color = colors[i % colors.length];
            const text = lines[lineIdx] || "";
            return color(pad(text, columnWidths[i]));
          })
          .join(chalk.gray(border.vertical)) +
        chalk.gray(border.vertical);

      console.log(rowText);
    }
  });

  // Print bottom border
  const bottomBorder =
    border.bottomLeft +
    columnWidths
      .map((w) => border.horizontal.repeat(w))
      .join(border.bottomJoin) +
    border.bottomRight;
  console.log(chalk.gray(bottomBorder));

  // Print footer with row count
  console.log(
    chalk.gray(`${rows.length} row${rows.length !== 1 ? "s" : ""} displayed\n`),
  );
}

/**
 * Interactive pagination for table data
 * @param {Function} fetchFunction - Async function that fetches data for a given page
 * @param {Object} initialOptions - Initial query options
 */
export async function paginateTable(fetchFunction, initialOptions = {}) {
  let currentPage = initialOptions.page || 1;

  // Setup readline for keypress events
  readline.emitKeypressEvents(process.stdin);
  if (process.stdin.isTTY) {
    process.stdin.setRawMode(true);
  }

  const showPage = async (page) => {
    // Clear screen completely using ANSI escape code (more reliable than console.clear)
    process.stdout.write("\x1Bc");

    // Show loading state
    const spinner = createSpinner(`Loading page ${page}...`);
    spinner.start();

    const options = { ...initialOptions, page };
    const response = await fetchFunction(options);

    spinner.stop();

    // If response is null/undefined, authentication failed
    if (!response) {
      logger.error("Failed to fetch data. Please login again.");
      return null; // Return null to signal fatal error
    }

    if (response && response.data) {
      formatTable(response.data);

      // Show pagination info
      console.log(chalk.cyan(`Page ${page}`));
      console.log(chalk.gray("─".repeat(50)));
      console.log(
        chalk.yellow("Controls: ") +
          chalk.white("[n]") +
          chalk.gray(" next  ") +
          chalk.white("[p]") +
          chalk.gray(" previous  ") +
          chalk.white("[q]") +
          chalk.gray(" quit"),
      );

      return response.data.length > 0;
    } else if (response) {
      formatTable(response);
      console.log(chalk.yellow("\nPress [q] to quit"));
      return false;
    }

    return false;
  };

  // Show initial page
  const initialResult = await showPage(currentPage);

  // If initial page load failed (auth error), exit immediately
  if (initialResult === null) {
    if (process.stdin.isTTY) {
      process.stdin.setRawMode(false);
    }
    process.stdin.pause();
    return;
  }

  // Wait for user input
  return new Promise((resolve) => {
    const cleanup = () => {
      process.stdin.removeListener("keypress", onKeypress);
      if (process.stdin.isTTY) {
        process.stdin.setRawMode(false);
      }
      process.stdin.pause();
      // Clear screen completely and reset cursor
      process.stdout.write("\x1Bc");
    };

    const onKeypress = async (str, key) => {
      if (key.ctrl && key.name === "c") {
        cleanup();
        process.exit();
      }

      if (key.name === "q") {
        cleanup();
        resolve();
        return;
      }

      if (key.name === "n") {
        currentPage++;
        const hasData = await showPage(currentPage);

        // Check for auth failure
        if (hasData === null) {
          cleanup();
          resolve();
          return;
        }

        if (!hasData) {
          console.log(chalk.red("\nNo more pages available"));
          currentPage--; // Go back if no data
          setTimeout(() => showPage(currentPage), 1500);
        }
      }

      if (key.name === "p") {
        if (currentPage > 1) {
          currentPage--;
          const result = await showPage(currentPage);

          // Check for auth failure
          if (result === null) {
            cleanup();
            resolve();
            return;
          }
        } else {
          console.log(chalk.red("\nAlready on first page"));
          setTimeout(() => showPage(currentPage), 1500);
        }
      }
    };

    process.stdin.on("keypress", onKeypress);
  });
}

/**
 * Format a single profile object as a vertical field-value table
 * @param {Object} profile - Profile object to display
 */
export function formatProfileDetails(profile) {
  if (!profile) {
    console.log(chalk.yellow("No profile data to display"));
    return;
  }

  // Define field display names and their corresponding data keys
  const fieldMapping = [
    { label: "ID", key: "id" },
    { label: "Username", key: "username" },
    { label: "Email", key: "email" },
    { label: "Role", key: "role" },
    { label: "Name", key: "name" },
    { label: "Age", key: "age" },
    { label: "Gender", key: "gender" },
    {
      label: "Country",
      key: "country_id",
      formatter: (value) => (value ? formatCountry(value) : value),
    },
    { label: "Age Group", key: "age_group" },
    { label: "Created At", key: "created_at" },
    { label: "Updated At", key: "updated_at" },
  ];

  // Filter out fields that don't exist in the profile
  const fields = fieldMapping.filter((field) =>
    Object.prototype.hasOwnProperty.call(profile, field.key),
  );

  // Calculate column widths
  const labelWidth = Math.max(...fields.map((f) => f.label.length)) + 2;
  const valueWidth = 40;

  // Box drawing characters
  const border = {
    topLeft: "┌",
    topRight: "┐",
    bottomLeft: "└",
    bottomRight: "┘",
    horizontal: "─",
    vertical: "│",
    leftJoin: "├",
    rightJoin: "┤",
  };

  // Helper to pad text
  const pad = (text, width) => {
    const str = String(text ?? "");
    return str + " ".repeat(Math.max(0, width - str.length));
  };

  // Print top border
  const topBorder =
    border.topLeft +
    border.horizontal.repeat(labelWidth) +
    border.leftJoin +
    border.horizontal.repeat(valueWidth) +
    border.topRight;
  console.log(chalk.gray(topBorder));

  // Print header row
  const headerRow =
    border.vertical +
    chalk.cyan.bold(pad("Field", labelWidth)) +
    chalk.gray(border.vertical) +
    chalk.green.bold(pad("Value", valueWidth)) +
    chalk.gray(border.vertical);
  console.log(headerRow);

  // Print header separator
  const headerSeparator =
    border.leftJoin +
    border.horizontal.repeat(labelWidth) +
    border.leftJoin +
    border.horizontal.repeat(valueWidth) +
    border.rightJoin;
  console.log(chalk.gray(headerSeparator));

  // Print each field-value pair
  fields.forEach((field) => {
    let value = profile[field.key];

    // Apply formatter if available
    if (field.formatter) {
      value = field.formatter(value);
    }

    const row =
      border.vertical +
      chalk.cyan(pad(field.label, labelWidth)) +
      chalk.gray(border.vertical) +
      chalk.white(pad(value, valueWidth)) +
      chalk.gray(border.vertical);
    console.log(row);
  });

  // Print bottom border
  const bottomBorder =
    border.bottomLeft +
    border.horizontal.repeat(labelWidth) +
    border.rightJoin +
    border.horizontal.repeat(valueWidth) +
    border.bottomRight;
  console.log(chalk.gray(bottomBorder));
  console.log(); // Empty line
}

/**
 * Format country code with full name if available
 * @param {String} countryCode - ISO 3166-1 alpha-2 country code
 * @returns {String} Formatted country string
 */
function formatCountry(countryCode) {
  // Map of common country codes to names
  const countryNames = {
    NG: "Nigeria",
    US: "United States",
    GB: "United Kingdom",
    EG: "Egypt",
    GH: "Ghana",
    KE: "Kenya",
    ZA: "South Africa",
    CA: "Canada",
    DE: "Germany",
    FR: "France",
    IN: "India",
    CN: "China",
    JP: "Japan",
    BR: "Brazil",
    MX: "Mexico",
    AU: "Australia",
  };

  const name = countryNames[countryCode];
  return name ? `${name} (${countryCode})` : countryCode;
}
