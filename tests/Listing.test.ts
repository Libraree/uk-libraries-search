import { Services } from '../src/services/Services';
import * as fs from 'fs/promises';

const folder = `${__dirname}/../docs`;
const fileExists = async path => !!(await fs.stat(path).catch(() => false));

test('Generate Library Listing', async () => {
    let content = '';
    const services = new Services();
    
    for (const service of services.listServices()) {
        content += `|${service.code}|[${service.name}](${service.catalogueUrl})|${service.type}|\n`;
    }
    
    if (await fileExists(`${folder}/listing.md`))
        await fs.unlink(`${folder}/listing.md`);

    const output = (await fs.readFile(`${folder}/listing-template.md`, 'utf-8'))
        .replace('%1', content)
        .replace('%2', new Date().toISOString());

    await fs.writeFile(`${folder}/listing.md`, output);
});