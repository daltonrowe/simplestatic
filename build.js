import * as fs from "node:fs";
import * as path from "node:path";

let file = process.argv.findIndex(
  (s) => s.includes("--file") || s.includes("-f"),
);

file = file !== -1 ? process.argv[file + 1] : undefined;

const distPath = path.join(import.meta.dirname, "dist");
const srcPath = path.join(import.meta.dirname, "src");
const pagesPath = path.join(srcPath, "pages");
const templatesPath = path.join(srcPath, "templates");
const templatesCache = {};

function reset() {
  if (fs.existsSync(distPath)) fs.rmSync(distPath, { recursive: true });
  fs.mkdirSync(distPath);
}

function writeFile(destination, content) {
  const dir = destination.split("/").slice(0, -1).join("/");
  if (dir) fs.mkdirSync(path.join(distPath, dir), { recursive: true });
  fs.writeFileSync(path.join(distPath, destination), content, {
    encoding: "utf-8",
  });
}

function loadTemplate(name) {
  if (templatesCache[name]) return templatesCache[name];

  const templatePath = path.join(templatesPath, `${name}.html`);
  const template = fs.readFileSync(templatePath, { encoding: "utf-8" });

  templatesCache[name] = template;
  return template;
}

function fillTemplate(template, meta) {
  let markup = template;

  for (const key in meta) {
    markup = markup.replaceAll(`{{${key}}}`, meta[key]);
  }

  return markup;
}

function copyStatic(dirs) {
  for (const dir of dirs) {
    fs.cpSync(path.join(srcPath, dir), path.join(distPath, dir), {
      recursive: true,
    });
  }
}

function collectMeta(content) {
  const [filemeta, html, ...rest] = content.split("%%%");

  const meta = { template: "default", html: html?.trim() };

  const json = JSON.parse(filemeta);
  for (const key of Object.keys(json)) meta[key] = json[key] ?? "";
  for (const i in rest)
    meta[`html_${Number.parseInt(i) + 2}`] = rest[i]?.trim() ?? "";

  return meta;
}

function createPage(destination, content) {
  const meta = collectMeta(content);
  const template = loadTemplate(meta.template);
  writeFile(destination, fillTemplate(template, meta));
}

function generate(entry = "") {
  const entryPath = path.join(pagesPath, entry);
  const relativePath = path.relative(pagesPath, entryPath);

  if (fs.statSync(entryPath).isDirectory()) {
    const dir = fs.readdirSync(entryPath);
    for (const item of dir) generate(path.join(relativePath, item));
    return;
  }

  const content = fs.readFileSync(entryPath, { encoding: "utf-8" });
  createPage(relativePath, content);
}

if (!file) reset();
copyStatic(["css", "img", "js"]);
generate(file);
