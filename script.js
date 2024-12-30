import { html, render } from "https://cdn.jsdelivr.net/npm/lit-html";
import { unsafeHTML } from "https://cdn.jsdelivr.net/npm/lit-html/directives/unsafe-html.js";
import { Marked } from "https://cdn.jsdelivr.net/npm/marked@13/+esm";
import { SSE } from "https://cdn.jsdelivr.net/npm/sse.js";

// Initialize the modal from Bootstrap
const marked = new Marked();
const $demoModal = new bootstrap.Modal(document.querySelector("#demo-modal"));
const $sidebar = document.getElementById("sidebar");
const $demos = document.getElementById("demo-container");
const searchInput = document.getElementById("search");
const clearFilterButton = document.getElementById("clear-filter");
let data = [];
let originalData = [];

const card = (demo, index) => {
  // Skip private demos when hide-private is active
  if (demo.Private && document.body.classList.contains('hide-private')) {
    return '';
  }

  const formattedDate = demo.Date
    ? new Date(demo.Date).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "";

  return html`
    <div class="card ${demo.Private ? 'private-demo' : ''}" data-demo-id="${index}" role="button">
      <div class="card-body">
        <h5 class="card-title">
          <small class="text-muted">#${index + 1}</small>
          ${demo.Featured ? html`<i class="me-1 bi bi-star-fill text-warning"></i>` : ""}
          ${demo.Video ? html`<i class="me-1 bi bi-youtube text-danger"></i>` : ""}
          ${demo.Project}
        </h5>
        <p class="card-text">${demo.Description}</p>
        <div class="mt-2">
          ${demo.Type === "Demo" ? html`<span class="badge bg-info">${demo.Type}</span>` : ""}
          ${demo.Solution ? html`<span class="badge bg-warning">${demo.Solution}</span>` : ""}
          ${demo.Industry ? html`<span class="badge bg-primary">${demo.Industry}</span>` : ""}
          ${demo.Function ? html`<span class="badge bg-success">${demo.Function}</span>` : ""}
          ${demo.Tech ? html`<span class="badge bg-secondary">${demo.Tech}</span>` : ""}
        </div>
        <div class="mt-2">
          ${formattedDate ? html`<span class="text-secondary small">${formattedDate}</span>` : ""}
        </div>
      </div>
    </div>`;
};

async function fetchData() {
  try {
    const response = await fetch("demo.json");
    originalData = await response.json();  // Store in originalData
    data = [...originalData];  // Create a copy for working data

    // Determine Type based on Link and Video properties
    data = data.map(demo => ({
      ...demo,
      Type: determineType(demo)
    }));
    originalData = [...data];  // Update originalData with Types

    redraw(data);
  } catch (error) {
    console.error("Error fetching data:", error);
  }
}

// Helper function to determine the Type
function determineType(demo) {
  if (demo.Link?.match(/docs\.google\.com|sharepoint\.com/)) {
    return "Doc";
  } else if (demo.Link?.match(/figma\.com/)) {
    return "Design";
  } else if (demo.Link) {
    return "Demo";
  } else if (demo.Video) {
    return "Video";
  } else {
    return "Other";
  }
}

// Function to generate and show the modal content
function demoModal(selectedId) {
  fetch("demo.json")
    .then((response) => response.json())
    .then((demos) => {
      const demo = demos[selectedId];
      const modalContent = `
        <div class="modal-header">
          <h5 class="modal-title">${demo.Project}</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
        </div>
        <div class="modal-body row align-items-stretch">
          <div class="col-md-6 col-lg-8 d-flex flex-column flex-grow-1">
            <p>${demo.Description ? marked.parse(demo.Description) : ""}</p>
            <div>
              ${
                demo.Video
                  ? demo.Video.split(/\s+/)
                      .filter((video) => video)
                      .map(renderVideo)
                      .join("")
                  : ""
              }
            </div>
            <div class="mb-auto"></div>
            ${
              demo.Username
                ? `
              <p>Log in as: <code>${demo.Username}</code>${demo.Password ? ` / <code>${demo.Password}</code>` : ""}</p>
            `
                : ""
            }
            ${
              demo.Link
                ? `
              <p>
                <a href="${demo.Link}" class="btn btn-primary w-100" target="_blank" rel="noopener">
                  <i class="bi bi-box-arrow-up-right"></i> Go to demo
                </a>
              </p>
            `
                : ""
            }
          </div>
          <div class="col-md-6 col-lg-4">
            <table class="table table-sm ms-2">
              <tbody>
                <tr>
                  <th scope="row">Updated</th>
                  <td>${new Date(demo.Date).toLocaleDateString()}</td>
                </tr>
                <tr>
                  <th scope="row">Client</th>
                  <td>${demo.Client}</td>
                </tr>
                <tr>
                  <th scope="row">Solution</th>
                  <td>${
                    demo.Solution
                      ? demo.Solution.split(",")
                          .map((s) => `<span class="badge text-bg-warning me-1">${s.trim()}</span>`)
                          .join("")
                      : ""
                  }</td>
                </tr>
                <tr>
                  <th scope="row">Industry</th>
                  <td>${
                    demo.Industry
                      ? demo.Industry.split(",")
                          .map((i) => `<span class="badge text-bg-primary me-1">${i.trim()}</span>`)
                          .join("")
                      : ""
                  }</td>
                </tr>
                <tr>
                  <th scope="row">Function</th>
                  <td>${
                    demo.Function
                      ? demo.Function.split(",")
                          .map((f) => `<span class="badge text-bg-success me-1">${f.trim()}</span>`)
                          .join("")
                      : ""
                  }</td>
                </tr>
                <tr>
                  <th scope="row">Tech</th>
                  <td>${
                    demo.Tech
                      ? demo.Tech.split(",")
                          .map((t) => `<span class="badge text-bg-secondary me-1">${t.trim()}</span>`)
                          .join("")
                      : ""
                  }</td>
                </tr>
                <tr>
                  <th scope="row">Contact</th>
                  <td>${demo.Contact ? `<a href="mailto:${demo.Contact}">${demo.Contact.split("@")[0]}</a>` : ""}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      `;

      // Insert modal content into the modal body
      document.querySelector("#demo-modal .modal-content").innerHTML = modalContent;

      // Show the modal
      $demoModal.show();
    })
    .catch((error) => console.error("Error loading demo data:", error));
}

function renderVideo(video) {
  if (video.match(/youtube\.com|youtu\.be/)) {
    // Extract the YouTube video ID
    const videoId = video.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/))([a-zA-Z0-9_-]+)/)?.[1];
    if (videoId) {
      // Render YouTube video thumbnail with link
      return `
        <a href="${video}" target="_blank" title="YouTube Video" class="d-inline-block thumb">
          <figure class="figure">
            <img
              src="https://img.youtube.com/vi/${videoId}/0.jpg"
              width="240"
              height="180"
              class="img-fluid img-thumbnail"
              alt="YouTube Video Thumbnail"
            />
            <figcaption class="figure-caption text-center">YouTube video demo</figcaption>
            <div class="play-button-overlay"></div>
          </figure>
        </a>
      `;
    }
  }

  // Fallback for non-YouTube videos (e.g., Google Drive or other links)
  return `
    <a href="${video}" target="_blank" title="Video" class="d-inline-block thumb">
      <figure class="figure">
        <img
          src="https://via.placeholder.com/240x180?text=Video+Thumbnail"
          width="240"
          height="180"
          class="img-fluid img-thumbnail"
          alt="Generic Video Thumbnail"
        />
        <figcaption class="figure-caption text-center">External video link</figcaption>
        <div class="play-button-overlay"></div>
      </figure>
    </a>
  `;
}

const searchColumns = ["Client", "Project", "Description", "Industry", "Function", "Solution"];
searchInput.addEventListener("input", () => {
  const query = searchInput.value.toLowerCase();
  const filtered = data.filter((demo) => searchColumns.some((key) => (demo[key] + "").toLowerCase().includes(query)));
  redraw(filtered);
});

// Clear filter button functionality
clearFilterButton.addEventListener("click", () => {
  searchInput.value = "";
  document.querySelectorAll("#demo-container .card").forEach((card) => (card.style.display = ""));
  clearFilterButton.classList.add("d-none");
});

// Sort functionality
document.querySelectorAll(".sort").forEach((sortOption) => {
  sortOption.addEventListener("click", (event) => {
    event.preventDefault();
    const sortConfig = JSON.parse(sortOption.dataset.sort);

    // Always start with a fresh copy of the original data
    data = [...originalData];  // Reset data to original state
    let filteredData = [...data];  // Create working copy

    // Handle special cases for filtering
    if (sortOption.dataset.sort.includes("Video")) {
      filteredData = data.filter(item => item.Video);  // Only show items with videos
    } else if (sortOption.dataset.sort.includes("Featured")) {
      filteredData = data.filter(item => item.Featured);  // Only show featured items
    } else if (sortOption.dataset.sort.includes("Date")) {
      filteredData = data.filter(item => item.Date);  // Only show items with dates
    }

    // Then sort the filtered data
    filteredData.sort((a, b) => {
      for (const [key, order] of sortConfig) {
        const aValue = a[key] ?? "";
        const bValue = b[key] ?? "";

        if (key === "Date") {
          const dateA = new Date(aValue);
          const dateB = new Date(bValue);
          const result = dateA - dateB;
          if (result !== 0) return order === "desc" ? -result : result;
        } else {
          const result = aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
          if (result !== 0) return order === "desc" ? -result : result;
        }
      }
      return 0;
    });

    // Update data and redraw
    data = filteredData;
    redraw(data);
  });
});

// AI Chat functionalities
document.querySelector("#ai-chat").addEventListener("submit", async (e) => {
  e.preventDefault();
  const $chatOutput = document.querySelector("#chat-output");
  const $input = document.querySelector("#chat-input");
  const loading = html`<div class="spinner-border text-primary mx-auto my-3 d-block loading" role="status"></div>`;
  $chatOutput.classList.add('active');
  try {
    // Get all demos from the original data
    const solutionsList = originalData
      .filter(demo => demo.Description && demo.Type === "Demo")
      .map(demo => `- ${demo.Project}: ${demo.Description.replace(/\n/g, " ")}`);

    if (solutionsList.length === 0) {
      render(html`<div class="alert alert-warning">No demos available to process.</div>`, $chatOutput);
      return;
    }

    const solutionsPrompt = `You are an expert business consultant. Given an industry and/or person's role, you write LLM use cases relevant for them.

    List down their top priorities. Then create a Markdown table listing the most relevant demos to show them.

    - Demo: Mention the most relevant demos from the list below. Mention the EXACT demo name.
    - Why is this relevant?: Explain how this aligns with their priorities. Highlight key words in **bold**. Write in simple, concise, entity-dense language.
    - Benefits: Mention the benefits for their priorities. Then mention a specific relevant metric in **bold**.

    List of demos in Demo: Description format:

    ${solutionsList.join("\n")}

    Communicate briefly and concisely. Convey rich information for a professional business context.
    `;

    render(loading, $chatOutput);

    // First check if we have a valid token
    const { token } = await fetch("https://llmfoundry.straive.com/token", {
      credentials: "include"
    }).then(res => res.json());

    if (!token) {
      // If no token, show login button
      const url = "https://llmfoundry.straive.com/login?" + new URLSearchParams({ next: location.href });
      render(
        html`<div class="alert alert-warning">Please <a href="${url}">log in</a> to use this feature.</div>`,
        $chatOutput
      );
      return;
    }

    // SSE setup for LLM API call with error handling
    const source = new SSE("https://llmfoundry.straive.com/openai/v1/chat/completions", {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      payload: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: solutionsPrompt },
          { role: "user", content: $input.value },
        ],
        stream: true,
        stream_options: { include_usage: true },
      }),
      start: false,
    });

    let output = "";
    source.addEventListener("message", function (e) {
      if (e.data == "[DONE]") {
        $chatOutput.querySelectorAll("table").forEach((table) => {
          table.classList.add("table", "table-sm", "table-striped");
          table.querySelectorAll("tbody tr").forEach((tr) => {
            const demos = tr.querySelector("td:first-child").textContent.split(/,\s*/);
            tr.querySelector("td:first-child").innerHTML = demos.map((demoName) => {
              // Find the demo index by matching the project name
              const demoIndex = originalData.findIndex(demo => demo.Project === demoName.trim());
              if (demoIndex !== -1) {
                return `<a href="#" class="demo-link" data-demo-id="${demoIndex}">${demoName.trim()}</a>`;
              }
              return demoName;
            }).join(", ");
          });
        });

        // Add click event listener for demo links
        $chatOutput.querySelectorAll(".demo-link").forEach(link => {
          link.addEventListener("click", (e) => {
            e.preventDefault();
            selectedId = e.target.dataset.demoId;
            showModal();
          });
        });
        return;
      }
      const payload = JSON.parse(e.data);
      output += payload?.choices?.[0]?.delta?.content ?? "";
      render(output ? html`${unsafeHTML(marked.parse(output))}` : loading, $chatOutput);
    });

      source.addEventListener("error", function(e) {
        render(html`<div class="alert alert-danger">Error: ${e.data || 'Failed to connect to LLM service'}</div>`, $chatOutput);
      });

      source.stream();

  } catch (error) {
    console.error('Error:', error);
    render(
      html`<div class="alert alert-danger">Error: ${error.message || 'Something went wrong'}</div>`,
      $chatOutput
    );
  }
});

function redraw(data) {
  const activeFilters = {};

  // Collect active filters
  for (const el of document.querySelectorAll("#sidebar .run-search.active")) {
    activeFilters[el.dataset.filter] = activeFilters[el.dataset.filter] || [];
    activeFilters[el.dataset.filter].push(el.dataset.value);
  }

  let filtered = data;
  for (const [key, values] of Object.entries(activeFilters)) {
    filtered = filtered.filter((demo) => {
      if (key === 'Type') {
        return values.includes(demo[key]);
      }
      return values.some((value) => demo[key] && demo[key].includes(value));
    });
  }

  const privateDemos = filtered.filter((d) => d.Private).length;
  const isHidingPrivate = document.body.classList.contains('hide-private');

  document.querySelector("#clear-filter").classList.toggle("d-none", Object.keys(activeFilters).length === 0)
  // Draw sidebar with facet filters
  render(
    ["Type", "Industry", "Function", "Solution", "Tech"].map(
      (key) =>
        html`<div class="accordion-item small">
          <h2 class="accordion-header">
            <button
              class="accordion-button"
              type="button"
              data-bs-toggle="collapse"
              data-bs-target="#collapse-${key}"
              aria-expanded="true"
              aria-controls="collapse-${key}"
            >
              ${key}
            </button>
          </h2>
          <div id="collapse-${key}" class="accordion-collapse collapse " data-bs-parent="#sidebar">
            <div class="list-group list-group-flush">
              ${[...new Set(data.map((demo) => demo[key]).flat())]
                .sort()
                .filter((v) => v)
                .map((item) => {
                  const count = filtered.filter((d) =>
                    d[key] && d[key].includes(item)
                  ).length;

                  return html`<a
                    href="#"
                    class="list-group-item list-group-item-action text-nowrap py-1 run-search d-flex justify-content-between align-items-center"
                    data-filter="${key}"
                    data-value="${item}"
                  >
                    ${item}
                    <span class="badge ${count === 0 ? "bg-body text-secondary" : "bg-secondary"} rounded-pill"
                      >${count}</span
                    >
                  </a>`;
                })}
            </div>
          </div>
        </div>`
    ),
    $sidebar
  );

  return render(
    html`<div class="row row-cols-1 row-cols-md-2 row-cols-xl-3 row-cols-xxl-4">
      ${filtered.map(card)}
      ${privateDemos && isHidingPrivate
        ? html`<div class="col my-2">
            <button class="alert alert-danger hide-private-action">
              ${privateDemos} private demo(s). Click "Private" to see
            </button>
          </div>`
        : ""}
    </div>`,
    $demos
  );
}

function showModal() {
  render(demoModal(selectedId), document.querySelector("#demo-modal .modal-content"));
  $demoModal.show();
}

let selectedId;
$demos.addEventListener("click", (e) => {
  const $filter = e.target.closest("[data-filter]");
  if ($filter) {
    e.preventDefault();
    $sidebar
      .querySelector(`[data-filter="${$filter.dataset.filter}"][data-value="${$filter.dataset.value}"]`)
      ?.classList.toggle("active");
    redraw(data);
    return;
  }
  const $demo = e.target.closest("[data-demo-id]");
  if ($demo) {
    selectedId = $demo.dataset.demoId;
    showModal();
  }
});

$sidebar.addEventListener("click", (e) => {
  const target = e.target.closest(".run-search");
  if (target) {
    e.preventDefault();
    target.classList.toggle("active");
    redraw(data);
  }
});

document.querySelector("#clear-filter").addEventListener("click", (e) => {
  e.preventDefault();
  const menus = [...document.querySelectorAll("#sidebar .run-search")];
  menus.forEach((el) => el.classList.remove("active"));
  redraw(data);
});


fetchData();