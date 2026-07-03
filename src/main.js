import { sampleSummary } from "./sample-data.js";

const PUBLIC_SUMMARY_API_URL = "https://publicdonationsummary-ytpfw6lbeq-ue.a.run.app";
const SLIDESHOW_INTERVAL_MS = 5000;

let currentDonationPage = 1;
let currentDonationPageSize = 35;
let activeGalleryIndex = 0;
let slideshowTimer;
let activeSummary;
let currentSummary;

const numberFormatter = new Intl.NumberFormat("en-US");

function formatCurrency(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function calculateProgressPercent(raised, goal) {
  const numericRaised = Number(raised);
  const numericGoal = Number(goal);

  if (!Number.isFinite(numericRaised) || !Number.isFinite(numericGoal) || numericGoal <= 0) {
    return 0;
  }

  return Math.min(Math.round((numericRaised / numericGoal) * 100), 100);
}

function getDonationPageSize() {
  if (window.matchMedia("(min-width: 1280px)").matches) {
    return 35;
  }

  if (window.matchMedia("(min-width: 768px)").matches) {
    return 24;
  }

  return 12;
}

function getDonationAmount(donation) {
  if (typeof donation.amount === "number") {
    return donation.amount;
  }

  if (typeof donation.amount === "string") {
    return Number(donation.amount) || 0;
  }

  if (typeof donation.amountCents === "number") {
    return donation.amountCents / 100;
  }

  return 0;
}

function formatDateLabel(donation) {
  if (donation.dateLabel) {
    return donation.dateLabel;
  }

  if (!donation.date) {
    return "";
  }

  const parsedDate = new Date(donation.date);
  if (Number.isNaN(parsedDate.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("es-PR", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(parsedDate);
}

function buildPagination(page, pageSize, total) {
  const totalPages = Math.max(Math.ceil(total / pageSize), 1);
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  return {
    page,
    pageSize,
    total,
    totalPages,
    start,
    end,
  };
}

function normalizeSummary(summary, page = 1, pageSize = currentDonationPageSize) {
  const donations = Array.isArray(summary.donations) ? summary.donations : [];
  const pagination = summary.pagination || buildPagination(page, pageSize, donations.length);

  return {
    ...summary,
    title: summary.title || sampleSummary.title || "Abrazo Solidario para Junelly",
    raised: Number(summary.raised || 0),
    goal: Number(summary.goal || 0),
    donorCount: Number(summary.donorCount || donations.length),
    progressPercent:
      typeof summary.progressPercent === "number"
        ? summary.progressPercent
        : calculateProgressPercent(summary.raised, summary.goal),
    milestones: Array.isArray(summary.milestones) ? summary.milestones : [],
    mediaGallery: sampleSummary.mediaGallery,
    donations,
    pagination,
  };
}

async function fetchPublicSummary(page, pageSize) {
  const url = new URL(PUBLIC_SUMMARY_API_URL);
  url.searchParams.set("page", page);
  url.searchParams.set("pageSize", pageSize);

  const response = await fetch(url.toString(), {
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Public summary request failed: ${response.status}`);
  }

  const data = await response.json();
  if (data.ok === false) {
    throw new Error("Public summary returned ok=false.");
  }

  return normalizeSummary(data, page, pageSize);
}

function getFallbackSummary(page = 1, pageSize = currentDonationPageSize) {
  const startIndex = (page - 1) * pageSize;
  const donations = sampleSummary.donations.slice(startIndex, startIndex + pageSize);
  const pagination = buildPagination(page, pageSize, sampleSummary.donations.length);

  return normalizeSummary(
    {
      ...sampleSummary,
      donations,
      pagination,
    },
    page,
    pageSize,
  );
}

async function getPublicSummary(page = 1, pageSize = currentDonationPageSize) {
  if (!PUBLIC_SUMMARY_API_URL) {
    return getFallbackSummary(page, pageSize);
  }

  try {
    return await fetchPublicSummary(page, pageSize);
  } catch (error) {
    console.warn("Using local sample data because the public API is unavailable.", error);
    const fallbackSummary = getFallbackSummary(page, pageSize);
    fallbackSummary.errorMessage =
      "No se pudo cargar la información en vivo. Mostrando datos de ejemplo.";
    return fallbackSummary;
  }
}

function renderProgress(summary) {
  const rawPercent =
    typeof summary.progressPercent === "number"
      ? summary.progressPercent
      : calculateProgressPercent(summary.raised, summary.goal);
  const visualPercent = Math.min(Math.round(rawPercent), 100);
  const donationCount = summary.donorCount || summary.pagination?.total || summary.donations.length;

  document.querySelector("#raised-amount").textContent = formatCurrency(summary.raised);
  document.querySelector("#goal-amount").textContent = formatCurrency(summary.goal);
  document.querySelector("#progress-percent").textContent =
    rawPercent >= 100 ? "Meta superada" : `${visualPercent}% completado`;
  document.querySelector("#donation-count").textContent =
    `${numberFormatter.format(donationCount)} aportaciones`;
  document.querySelector("#progress-fill").style.width = `${visualPercent}%`;
}

function renderMilestones(summary) {
  const milestones = document.querySelector("#milestones");
  milestones.innerHTML = "";

  summary.milestones.forEach((milestone) => {
    const amount = Number(typeof milestone === "number" ? milestone : milestone.amount);
    const label = typeof milestone === "number" ? formatCurrency(milestone) : milestone.label;
    const reached =
      typeof milestone === "number" ? summary.raised >= milestone : Boolean(milestone.reached);
    const marker = document.createElement("span");
    const position = Math.min(calculateProgressPercent(amount, summary.goal), 100);
    marker.className = `milestone${reached ? " reached" : ""}`;
    marker.style.left = `${position}%`;
    marker.dataset.label = label;
    milestones.append(marker);
  });
}

function renderMediaItem(item) {
  const frame = document.querySelector("#media-frame");
  frame.classList.add("is-fading");

  setTimeout(() => {
    frame.innerHTML =
      item.type === "video"
        ? `<video src="${item.src}" aria-label="${item.alt}" controls></video>`
        : `<img src="${item.src}" alt="${item.alt}">`;
    frame.classList.remove("is-fading");
  }, 180);
}

function setActiveMedia(index) {
  if (!activeSummary) {
    return;
  }

  const mediaItems = activeSummary.mediaGallery.slice(0, 4);
  activeGalleryIndex = (index + mediaItems.length) % mediaItems.length;
  renderMediaGallery(activeSummary);
}

function renderMediaGallery(summary) {
  activeSummary = summary;
  const thumbnailRow = document.querySelector("#thumbnail-row");
  const activeItem = summary.mediaGallery[activeGalleryIndex] || summary.mediaGallery[0];

  renderMediaItem(activeItem);
  thumbnailRow.innerHTML = "";

  summary.mediaGallery.slice(0, 4).forEach((item, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `thumbnail${index === activeGalleryIndex ? " active" : ""}`;
    button.setAttribute("aria-label", `Mostrar imagen: ${item.title}`);
    button.innerHTML = `
      <img src="${item.src}" alt="${item.alt}">
      <span>${item.title}</span>
    `;
    button.addEventListener("click", () => {
      setActiveMedia(index);
      stopMediaSlideshow();
      startMediaSlideshow();
    });
    thumbnailRow.append(button);
  });
}

function startMediaSlideshow() {
  slideshowTimer = setInterval(() => {
    setActiveMedia(activeGalleryIndex + 1);
  }, SLIDESHOW_INTERVAL_MS);
}

function stopMediaSlideshow() {
  clearInterval(slideshowTimer);
}

function getDisplayName(donation) {
  return donation.anonymous ? "Anónimo" : donation.name || "Anónimo";
}

function renderDonations(summary) {
  const donationList = document.querySelector("#donations-list");
  donationList.innerHTML = "";

  summary.donations.forEach((donation) => {
    const item = document.createElement("article");
    item.className = "donation-item";

    const header = document.createElement("div");
    header.className = "donation-card-header";

    const name = document.createElement("strong");
    name.className = "donation-name";
    name.textContent = getDisplayName(donation);

    const amount = document.createElement("span");
    amount.className = "donation-amount";
    amount.textContent = formatCurrency(getDonationAmount(donation));

    header.append(name, amount);

    const date = document.createElement("span");
    date.className = "donation-date";
    date.textContent = formatDateLabel(donation);

    item.append(header, date);

    if (donation.message) {
      const message = document.createElement("p");
      message.className = "donation-message";
      message.textContent = donation.message;
      item.append(message);
    }
    donationList.append(item);
  });
}

function renderPagination(pagination, errorMessage = "") {
  const paginationSummary = document.querySelector("#pagination-summary");
  const prevButton = document.querySelector("#prev-page");
  const nextButton = document.querySelector("#next-page");

  paginationSummary.textContent =
    errorMessage ||
    `Mostrando ${pagination.start} al ${pagination.end} de ${pagination.total} aportaciones.`;

  prevButton.disabled = pagination.page <= 1;
  nextButton.disabled = pagination.page >= pagination.totalPages;

  prevButton.onclick = () => {
    if (pagination.page > 1) {
      setCurrentPage(pagination.page - 1);
    }
  };

  nextButton.onclick = () => {
    if (pagination.page < pagination.totalPages) {
      setCurrentPage(pagination.page + 1);
    }
  };
}

function renderSummary(summary, { renderGallery = false } = {}) {
  renderProgress(summary);
  renderMilestones(summary);
  renderDonations(summary);
  renderPagination(summary.pagination, summary.errorMessage);

  if (renderGallery) {
    renderMediaGallery(summary);
  }
}

async function setCurrentPage(page) {
  const paginationSummary = document.querySelector("#pagination-summary");
  const prevButton = document.querySelector("#prev-page");
  const nextButton = document.querySelector("#next-page");

  paginationSummary.textContent = "Cargando aportaciones...";
  prevButton.disabled = true;
  nextButton.disabled = true;

  currentDonationPage = page;
  currentSummary = await getPublicSummary(page, currentDonationPageSize);
  renderSummary(currentSummary);
}

async function init() {
  currentDonationPageSize = getDonationPageSize();
  currentSummary = await getPublicSummary(currentDonationPage, currentDonationPageSize);
  renderSummary(currentSummary, { renderGallery: true });
  startMediaSlideshow();
}

init();
