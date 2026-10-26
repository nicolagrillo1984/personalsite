// Nicola Grillo — blog admin panel
// Edits blog article files directly in the GitHub repo via the Contents API.
// No backend, no database: the repo IS the content store. The token the
// user enters lives only in sessionStorage (cleared when the tab closes)
// and is sent only to api.github.com, straight from this browser.
(function () {
  "use strict";

  var API = "https://api.github.com";
  var session = {
    owner: sessionStorage.getItem("ng-admin-owner") || "",
    repo: sessionStorage.getItem("ng-admin-repo") || "",
    token: sessionStorage.getItem("ng-admin-token") || ""
  };
  var current = { slug: "", sha: "", raw: "" };

  var $ = function (id) { return document.getElementById(id); };
  var loginCard = $("login-card");
  var editorCard = $("editor-card");
  var loginStatus = $("login-status");
  var editorStatus = $("editor-status");

  function setStatus(el, msg, type) {
    el.textContent = msg || "";
    el.className = "admin-status" + (type ? " is-" + type : "");
  }

  function gh(path, opts) {
    opts = opts || {};
    var headers = {
      Authorization: "Bearer " + session.token,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28"
    };
    if (opts.body) headers["Content-Type"] = "application/json";
    return fetch(API + path, {
      method: opts.method || "GET",
      headers: headers,
      body: opts.body ? JSON.stringify(opts.body) : undefined
    }).then(function (res) {
      if (!res.ok) {
        return res.json().catch(function () { return {}; }).then(function (err) {
          throw new Error((err && err.message) || ("Errore GitHub " + res.status));
        });
      }
      return res.json();
    });
  }

  function utf8ToB64(str) {
    return btoa(unescape(encodeURIComponent(str)));
  }
  function b64ToUtf8(b64) {
    return decodeURIComponent(escape(atob(b64.replace(/\n/g, ""))));
  }

  function fillArticlePicker(items) {
    var select = $("f-article");
    select.innerHTML = "";
    items.forEach(function (item) {
      if (item.type !== "dir") return;
      var opt = document.createElement("option");
      opt.value = item.name;
      opt.textContent = item.name;
      select.appendChild(opt);
    });
    if (select.options.length) loadArticle(select.value);
  }

  function loadArticle(slug) {
    setStatus(editorStatus, "Caricamento…");
    gh("/repos/" + session.owner + "/" + session.repo + "/contents/blog/" + encodeURIComponent(slug) + "/index.html")
      .then(function (data) {
        var raw = b64ToUtf8(data.content);
        current.slug = slug;
        current.sha = data.sha;
        current.raw = raw;

        var titleMatch = raw.match(/<!--EDIT:TITLE:START-->([\s\S]*?)<!--EDIT:TITLE:END-->/);
        var bodyMatch = raw.match(/<!--EDIT:BODY:START-->([\s\S]*?)<!--EDIT:BODY:END-->/);

        if (!titleMatch || !bodyMatch) {
          setStatus(editorStatus, "Questo articolo non ha i marcatori di modifica (EDIT:TITLE / EDIT:BODY): va aggiornato manualmente.", "error");
          $("f-title").value = "";
          $("f-body").value = "";
          return;
        }
        $("f-title").value = titleMatch[1].trim();
        $("f-body").value = bodyMatch[1].trim();
        $("btn-view").href = "../blog/" + slug + "/";
        setStatus(editorStatus, "Caricato.", "ok");
      })
      .catch(function (err) {
        setStatus(editorStatus, "Errore nel caricamento: " + err.message, "error");
      });
  }

  function escapeHtml(s) {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  function saveArticle() {
    if (!current.slug) return;
    var newTitle = $("f-title").value.trim();
    var newBody = $("f-body").value;

    var updated = current.raw
      .replace(/<!--EDIT:TITLE:START-->[\s\S]*?<!--EDIT:TITLE:END-->/, "<!--EDIT:TITLE:START-->" + escapeHtml(newTitle) + "<!--EDIT:TITLE:END-->")
      .replace(/<!--EDIT:BODY:START-->[\s\S]*?<!--EDIT:BODY:END-->/, "<!--EDIT:BODY:START-->\n" + newBody + "\n<!--EDIT:BODY:END-->");

    setStatus(editorStatus, "Salvataggio…");
    $("btn-save").disabled = true;

    gh("/repos/" + session.owner + "/" + session.repo + "/contents/blog/" + encodeURIComponent(current.slug) + "/index.html", {
      method: "PUT",
      body: {
        message: "Modifica articolo \"" + current.slug + "\" via pannello admin",
        content: utf8ToB64(updated),
        sha: current.sha
      }
    })
      .then(function (data) {
        current.raw = updated;
        current.sha = data.content.sha;
        setStatus(editorStatus, "Pubblicato. Potrebbero volerci alcuni minuti prima che il sito live si aggiorni.", "ok");
      })
      .catch(function (err) {
        setStatus(editorStatus, "Errore nel salvataggio: " + err.message + " (ricarica l'articolo e riprova)", "error");
      })
      .finally(function () {
        $("btn-save").disabled = false;
      });
  }

  function doLogin() {
    var owner = $("f-owner").value.trim();
    var repo = $("f-repo").value.trim();
    var token = $("f-token").value.trim();
    if (!owner || !repo || !token) {
      setStatus(loginStatus, "Compila proprietario, repository e token.", "error");
      return;
    }
    session = { owner: owner, repo: repo, token: token };
    setStatus(loginStatus, "Verifica in corso…");

    gh("/repos/" + owner + "/" + repo)
      .then(function () {
        return gh("/repos/" + owner + "/" + repo + "/contents/blog");
      })
      .then(function (items) {
        sessionStorage.setItem("ng-admin-owner", owner);
        sessionStorage.setItem("ng-admin-repo", repo);
        sessionStorage.setItem("ng-admin-token", token);
        $("f-token").value = "";
        $("repo-label").textContent = owner + "/" + repo;
        loginCard.classList.add("hidden");
        editorCard.classList.remove("hidden");
        fillArticlePicker(items);
      })
      .catch(function (err) {
        setStatus(loginStatus, "Accesso non riuscito: " + err.message, "error");
      });
  }

  function doLogout() {
    sessionStorage.removeItem("ng-admin-owner");
    sessionStorage.removeItem("ng-admin-repo");
    sessionStorage.removeItem("ng-admin-token");
    session = { owner: "", repo: "", token: "" };
    current = { slug: "", sha: "", raw: "" };
    editorCard.classList.add("hidden");
    loginCard.classList.remove("hidden");
    $("f-token").value = "";
    setStatus(loginStatus, "Sessione chiusa.", "ok");
  }

  $("btn-login").addEventListener("click", doLogin);
  $("btn-logout").addEventListener("click", doLogout);
  $("btn-save").addEventListener("click", saveArticle);
  $("btn-reload").addEventListener("click", function () { if (current.slug) loadArticle(current.slug); });
  $("f-article").addEventListener("change", function (e) { loadArticle(e.target.value); });

  // Resume an existing session (same tab) without re-asking for the token.
  if (session.owner && session.repo && session.token) {
    $("f-owner").value = session.owner;
    $("f-repo").value = session.repo;
    $("repo-label").textContent = session.owner + "/" + session.repo;
    loginCard.classList.add("hidden");
    editorCard.classList.remove("hidden");
    gh("/repos/" + session.owner + "/" + session.repo + "/contents/blog")
      .then(fillArticlePicker)
      .catch(function () { doLogout(); });
  }
})();
