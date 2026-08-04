(function () {
  "use strict";

  var MAX_FILE_SIZE = 2 * 1024 * 1024;
  var ROUTE_PREFIX = "#/collections/posts/new";
  var ALLOWED_FIELDS = [
    "title", "description", "category", "type", "tags", "publishDate",
    "updatedDate", "lastReviewed", "series", "seriesOrder", "difficulty",
    "platform", "cover", "coverAlt", "featured", "draft"
  ];

  function normalizeDate(value) {
    if (value instanceof Date && !Number.isNaN(value.valueOf())) {
      return value.toISOString().slice(0, 10);
    }
    return value == null ? "" : String(value).trim();
  }

  function parseMarkdownFileContent(source) {
    var text = String(source || "").replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n");
    var match = text.match(/^---[ \t]*\n([\s\S]*?)\n---[ \t]*(?:\n|$)([\s\S]*)$/);
    if (!match) {
      throw new Error("文件必须以 --- 包裹的 YAML Frontmatter 开头。");
    }
    if (!window.jsyaml || typeof window.jsyaml.load !== "function") {
      throw new Error("YAML 解析器加载失败，请刷新后台后重试。");
    }

    var parsed = window.jsyaml.load(match[1]);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new Error("Frontmatter 必须是 YAML 对象。");
    }

    var data = {};
    ALLOWED_FIELDS.forEach(function (name) {
      if (parsed[name] !== undefined && parsed[name] !== null && parsed[name] !== "") {
        data[name] = parsed[name];
      }
    });

    ["publishDate", "updatedDate", "lastReviewed"].forEach(function (name) {
      if (data[name] !== undefined) data[name] = normalizeDate(data[name]);
    });

    if (data.tags !== undefined && !Array.isArray(data.tags)) {
      data.tags = String(data.tags).split(",").map(function (tag) { return tag.trim(); }).filter(Boolean);
    }
    if (Array.isArray(data.tags)) {
      data.tags = data.tags.map(function (tag) { return String(tag).trim(); }).filter(Boolean);
    }

    data.body = match[2].replace(/^\n+/, "");
    return data;
  }

  function buildEditorUrl(data) {
    var params = new URLSearchParams();
    Object.keys(data).forEach(function (name) {
      var value = data[name];
      if (Array.isArray(value)) {
        value.forEach(function (item) { params.append(name, String(item)); });
      } else {
        params.set(name, String(value));
      }
    });
    return ROUTE_PREFIX + "?" + params.toString();
  }

  function shouldShowImporter() {
    return /^#\/(collections|workflow)(?:\/|$)/.test(window.location.hash);
  }

  function createImporter() {
    var root = document.createElement("div");
    root.className = "markdown-importer";
    root.hidden = !shouldShowImporter();

    var message = document.createElement("div");
    message.className = "markdown-importer__message";
    message.hidden = true;
    message.setAttribute("role", "status");
    message.setAttribute("aria-live", "polite");

    var input = document.createElement("input");
    input.type = "file";
    input.accept = ".md,.markdown,text/markdown,text/plain";

    var button = document.createElement("button");
    button.type = "button";
    button.className = "markdown-importer__button";
    button.textContent = "导入 Markdown";

    var messageTimer;
    function showMessage(text, state) {
      window.clearTimeout(messageTimer);
      message.textContent = text;
      message.dataset.state = state || "info";
      message.hidden = false;
      messageTimer = window.setTimeout(function () { message.hidden = true; }, 6000);
    }

    button.addEventListener("click", function () {
      input.value = "";
      input.click();
    });

    input.addEventListener("change", async function () {
      var file = input.files && input.files[0];
      if (!file) return;
      if (!/\.(md|markdown)$/i.test(file.name)) {
        showMessage("请选择 .md 或 .markdown 文件。", "error");
        return;
      }
      if (file.size > MAX_FILE_SIZE) {
        showMessage("Markdown 文件不能超过 2 MB。", "error");
        return;
      }

      try {
        button.disabled = true;
        button.textContent = "正在解析…";
        var data = parseMarkdownFileContent(await file.text());
        var missing = ["title", "description", "publishDate", "category", "tags"]
          .filter(function (name) { return data[name] === undefined || data[name] === "" || (Array.isArray(data[name]) && data[name].length === 0); });
        if (missing.length) {
          showMessage("已导入；请在发布前补充必填字段：" + missing.join("、"), "error");
        }
        window.location.hash = buildEditorUrl(data);
      } catch (error) {
        showMessage(error instanceof Error ? error.message : "Markdown 解析失败。", "error");
      } finally {
        button.disabled = false;
        button.textContent = "导入 Markdown";
      }
    });

    root.appendChild(message);
    root.appendChild(input);
    root.appendChild(button);
    document.body.appendChild(root);

    window.addEventListener("hashchange", function () {
      root.hidden = !shouldShowImporter();
    });
  }

  window.NothingSecMarkdownImporter = Object.freeze({
    parse: parseMarkdownFileContent,
    buildEditorUrl: buildEditorUrl
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", createImporter, { once: true });
  } else {
    createImporter();
  }
})();
