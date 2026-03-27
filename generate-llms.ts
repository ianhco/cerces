import fs from "fs"
import path from "path"
import config from "./docs/.vitepress/config.ts"

// 1. Get the ordered list from the sidebar config
const sidebarConfig = (config as any).themeConfig?.sidebar || {}
const orderMap = new Map<string, number>()

let orderIndex = 0
// index.md always first
orderMap.set("index.md", orderIndex++)

function extractLinks(items: any[]) {
    for (const item of items) {
        if (item.link) {
            // Remove leading slash to match the relative paths
            const relPath = item.link.startsWith("/") ? item.link.substring(1) : item.link;
            if (!orderMap.has(relPath)) {
                orderMap.set(relPath, orderIndex++);
            }
        }
        if (item.items) {
            extractLinks(item.items);
        }
    }
}

// Extract links in order
const sidebarKeys = ["/guides/", "/reference/", "/migrations/"];
for (const key of sidebarKeys) {
    if (sidebarConfig[key]?.items) {
        extractLinks(sidebarConfig[key].items);
    }
}

function getFiles(dir: string): string[] {
    let results: string[] = [];
    const list = fs.readdirSync(dir);
    for (const file of list) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat && stat.isDirectory()) {
            results = results.concat(getFiles(fullPath));
        } else if (fullPath.endsWith('.md')) {
            results.push(fullPath);
        }
    }
    return results;
}

const allFiles = getFiles('docs').filter(f => !f.endsWith('llms.txt') && !f.endsWith('llms-full.txt'));

let links: string[] = [];
let fullText = '';

let looseIndex = 1000;
const getOrder = (filename: string): number => {
    let relative = path.relative('docs', filename).replace(/\\/g, '/');
    if (orderMap.has(relative)) {
        return orderMap.get(relative)!;
    }
    // Unmapped files go to the bottom
    return looseIndex++;
};

allFiles.sort((a, b) => getOrder(a) - getOrder(b));

for (const file of allFiles) {
    const relative = path.relative('docs', file).replace(/\\/g, '/');
    const extLess = relative.replace(/\.md$/, '');
    const urlPath = relative === 'index.md' ? '' : extLess;
    let url = 'https://cerces.dev/' + urlPath;
    if (url.endsWith('/')) {
        url = url.slice(0, -1);
    }
    
    let content = fs.readFileSync(file, 'utf8');
    const titleMatch = content.match(/^# (.*)$/m);
    const title = titleMatch ? titleMatch[1] : relative;
    links.push(`- [${title}](${url})`);
    
    // Remove frontmatter if present
    content = content.replace(/^---\n[\s\S]*?\n---\n/, '');
    
    fullText += '\n\n## ' + relative + '\n\n' + content.trim();
}

const llmsTxt = `Cerces is a type-safe, modern, and intuitive web framework built on Web Standards and OpenAPI.\n\n${links.join('\n')}\n\n[Full Documentation](https://cerces.dev/llms-full.txt)`;

fs.writeFileSync('docs/llms.txt', llmsTxt);
fs.writeFileSync('docs/llms-full.txt', fullText.trim());
console.log('Generated docs/llms.txt and docs/llms-full.txt');
