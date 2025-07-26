import * as fs from "node:fs";
import * as path from "node:path";

const distPath = path.join(import.meta.dirname, "dist");
const templatesCache = {};

function reset() {
  const distExists = fs.existsSync(distPath);

  if (distExists) fs.rmSync(distPath, { recursive: true });
  fs.mkdirSync(distPath);
}

reset();

function loadTemplate(name) {
  if (templatesCache[name]) return templatesCache[name];

  const templatePath = path.join(
    import.meta.dirname,
    "templates",
    `${name}.html`,
  );

  const template = fs.readFileSync(templatePath, {
    encoding: "utf-8",
  });

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
    fs.cpSync(path.join(import.meta.dirname, dir), path.join(distPath, dir), {
      recursive: true,
    });
  }
}

function collectMeta(content) {
  const [filemeta, html] = content.split("%%%");

  const meta = {
    html: html?.trim(),
    template: "default",
  };

  const json = JSON.parse(filemeta);

  for (const key of Object.keys(json)) {
    meta[key] = json[key] ?? "";
  }

  return meta;
}

function writePage(filename, content) {
  const meta = collectMeta(content);
  const template = loadTemplate(meta.template);

  if (meta.html) {
    const generated = fillTemplate(template, meta);

    const distFilePath = path.join(distPath, `${filename.split(".")[0]}.html`);

    fs.writeFileSync(distFilePath, generated, {
      encoding: "utf-8",
      recursive: true,
    });
  }
}

function generate(entry) {
  const entryDir = entry ? `pages/${entry}` : 'pages'

  if (fs.statSync(entryDir).isFile()) {
    const content = fs.readFileSync(entryDir, { encoding: "utf-8" });
    writePage(entry, content);
  } else {
    const dir = fs.readdirSync(entryDir);
    for (const item in dir) generate(item);
  }
}

copyStatic(["css", "img", "js"]);
generate("index.html");
