#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import os from 'os';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import picocolors from 'picocolors';
import ora from 'ora';
import prompts from 'prompts';
import * as asar from '@electron/asar';
import figlet from 'figlet';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const { blue, cyan, green, red, yellow, bold, magenta, dim } = picocolors;

const pkgPath = path.join(__dirname, '..', 'package.json');
let pkg = { version: '1.0.0' };
try {
    pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
} catch (e) {}

function printBanner() {
    try {
        const fullArt = figlet.textSync('ZCode', { font: 'Standard' }).split('\n');
        console.log('');
        for (const line of fullArt) {
            if (!line.trim()) continue;
            console.log(bold(cyan(line)));
        }
        console.log('');
        console.log(bold(`  ZCode Pro RTL Injector | v${pkg.version}`));
        console.log(`  GitHub: https://github.com/arian13es/zcode-rtl\n`);
    } catch (err) {
        console.log(bold(`\n✨ ZCode Pro RTL Injector v${pkg.version}`));
        console.log(`  GitHub: https://github.com/arian13es/zcode-rtl\n`);
    }
}

printBanner();

const args = process.argv.slice(2);
const isRestore = args.includes('--restore');
const isHelp = args.includes('--help') || args.includes('-h');
const isAutoYes = args.includes('-y') || args.includes('--yes');

if (isHelp) {
    console.log(`
Usage: zcode-rtl [options]

Options:
  --restore     Revert ZCode to its original factory state from backup
  -y, --yes     Automatically close running ZCode instances without prompting
  --help, -h    Display this help menu
`);
    process.exit(0);
}

function checkRunningProcesses() {
    try {
        if (os.platform() === 'win32') {
            const out = execSync('tasklist /FI "IMAGENAME eq ZCode.exe" /NH', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
            return out.toLowerCase().includes('zcode.exe');
        } else {
            const out = execSync('pgrep -i zcode || true', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
            return out.trim().length > 0;
        }
    } catch (e) {
        return false;
    }
}

function getCandidatePaths() {
    const candidates = [];
    const platform = os.platform();

    if (platform === 'win32') {
        const localAppData = process.env.LOCALAPPDATA || '';
        const programFiles = process.env.ProgramFiles || 'C:\\Program Files';
        const programFilesX86 = process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)';

        candidates.push(
            // Primary ZCode Desktop production installation
            path.join(localAppData, 'Programs', 'ZCode', 'resources', 'app.asar'),
            path.join(localAppData, 'Programs', '@zcodedesktop', 'resources', 'app.asar'),
            path.join(localAppData, 'Programs', 'zcode', 'resources', 'app.asar'),
            path.join(programFiles, 'ZCode', 'resources', 'app.asar'),
            path.join(programFilesX86, 'ZCode', 'resources', 'app.asar'),
            // Channels
            path.join(localAppData, 'Programs', 'ZCode Beta', 'resources', 'app.asar'),
            path.join(localAppData, 'Programs', 'ZCode Dev', 'resources', 'app.asar'),
            // Unpacked app directory variants
            path.join(localAppData, 'Programs', 'ZCode', 'resources', 'app'),
            path.join(localAppData, 'Programs', '@zcodedesktop', 'resources', 'app'),
            path.join(localAppData, 'Programs', 'zcode', 'resources', 'app')
        );
    } else if (platform === 'darwin') {
        const home = process.env.HOME || '';
        candidates.push(
            '/Applications/ZCode.app/Contents/Resources/app.asar',
            path.join(home, 'Applications', 'ZCode.app', 'Contents', 'Resources', 'app.asar'),
            '/Applications/ZCode Beta.app/Contents/Resources/app.asar',
            '/Applications/ZCode Dev.app/Contents/Resources/app.asar',
            '/Applications/@zcodedesktop.app/Contents/Resources/app.asar',
            // Unpacked
            '/Applications/ZCode.app/Contents/Resources/app'
        );
    } else {
        // Linux
        const home = process.env.HOME || '';
        candidates.push(
            '/opt/ZCode/resources/app.asar',
            '/opt/zcode/resources/app.asar',
            '/usr/lib/zcode/resources/app.asar',
            '/usr/share/zcode/resources/app.asar',
            path.join(home, '.local', 'share', 'zcode', 'resources', 'app.asar'),
            '/opt/ZCode/resources/app',
            '/opt/zcode/resources/app'
        );
    }

    return candidates.filter(p => fs.existsSync(p));
}

async function patchUnpackedApp(appDir, isRestore) {
    console.log(blue(`\n[✓] Target locked: ZCode directory located at ${appDir}`));
    const spinner = ora('Auditing ZCode structure...').start();

    const rendererDir = path.join(appDir, 'out', 'renderer');
    const indexHtml = path.join(rendererDir, 'index.html');

    if (!fs.existsSync(indexHtml)) {
        spinner.fail('Incompatible ZCode structure. out/renderer/index.html not found.');
        return;
    }

    const backupHtml = indexHtml + '.bak';

    if (isRestore) {
        if (fs.existsSync(backupHtml)) {
            fs.copyFileSync(backupHtml, indexHtml);
            const targetJs = path.join(rendererDir, 'zcode-payload.js');
            if (fs.existsSync(targetJs)) fs.unlinkSync(targetJs);
            const fontDest = path.join(rendererDir, 'Vazirmatn-Variable.woff2');
            if (fs.existsSync(fontDest)) fs.unlinkSync(fontDest);
            spinner.succeed('ZCode directory architecture successfully reverted to factory state.');
        } else {
            spinner.info('No backups detected. Factory reset aborted for ZCode directory.');
        }
        return;
    }

    spinner.text = 'Deploying Pro UI payload into ZCode renderer...';
    try {
        const payloadPath = path.join(__dirname, 'zcode-payload.js');
        let payloadCode = fs.readFileSync(payloadPath, 'utf8');

        const fontPath = path.join(__dirname, 'Vazirmatn-Variable.woff2');
        let fontBase64 = '';
        if (fs.existsSync(fontPath)) {
            fontBase64 = fs.readFileSync(fontPath).toString('base64');
        }
        payloadCode = payloadCode.replace('__FONT_BASE64__', fontBase64);

        const targetJsPath = path.join(rendererDir, 'zcode-payload.js');
        fs.writeFileSync(targetJsPath, payloadCode);

        const fontDest = path.join(rendererDir, 'Vazirmatn-Variable.woff2');
        if (fs.existsSync(fontPath)) {
            fs.copyFileSync(fontPath, fontDest);
        }

        if (!fs.existsSync(backupHtml)) {
            fs.copyFileSync(indexHtml, backupHtml);
        }

        let htmlCode = fs.readFileSync(indexHtml, 'utf8');
        let modified = false;

        if (!htmlCode.includes('zcode-payload.js')) {
            if (htmlCode.includes('</body>')) {
                htmlCode = htmlCode.replace('</body>', '  <script src="./zcode-payload.js"></script>\n</body>');
            } else {
                htmlCode = htmlCode.replace('</html>', '  <script src="./zcode-payload.js"></script>\n</html>');
            }
            modified = true;
        }

        if (modified) {
            fs.writeFileSync(indexHtml, htmlCode);
            spinner.succeed('★ ZCode ecosystem successfully overhauled with Pro RTL UI!');
        } else {
            spinner.succeed('ZCode is already operating on the patched Pro RTL architecture.');
        }
    } catch (e) {
        spinner.fail('Failed to patch ZCode directory.');
        console.error(red(e.message));
    }
}

async function patchAsar(asarPath, isRestore) {
    console.log(blue(`\n[✓] Target locked: ZCode ASAR package located at ${asarPath}`));

    const backupPath = asarPath + '.bak';

    if (isRestore) {
        if (!fs.existsSync(backupPath)) {
            console.log(yellow('[!] Alert: Backup missing. Cannot revert ZCode core.'));
            return;
        }
        const spinner = ora('Reverting ZCode ASAR core to factory state...').start();
        try {
            fs.copyFileSync(backupPath, asarPath);
            spinner.succeed('ZCode successfully reverted to factory state.');
        } catch (e) {
            spinner.fail('Critical failure during ASAR restoration.');
            console.error(red(e.message));
        }
        return;
    }

    const spinner = ora('Acquiring write permissions & establishing backup...').start();
    try {
        fs.accessSync(path.dirname(asarPath), fs.constants.W_OK);
        if (!fs.existsSync(backupPath)) {
            fs.copyFileSync(asarPath, backupPath);
        }
    } catch (e) {
        spinner.fail('Access Denied.');
        console.error(red('\n[!] OS Exception: ' + e.message));
        console.error(yellow('Action required: Elevate your terminal privileges (Run as Administrator/sudo).'));
        return;
    }

    const extractDir = path.join(path.dirname(asarPath), 'zcode-extracted-rtl-temp');
    spinner.text = 'Decrypting and unpacking ZCode ASAR package...';
    try {
        if (fs.existsSync(extractDir)) {
            fs.rmSync(extractDir, { recursive: true, force: true });
        }
        asar.extractAll(asarPath, extractDir);
    } catch (e) {
        spinner.fail('ASAR package unpacking failed.');
        console.error(red(e.message));
        return;
    }

    spinner.text = 'Injecting Unified RTL module & Pro UI widget...';
    try {
        const rendererDir = path.join(extractDir, 'out', 'renderer');
        const indexHtmlPath = path.join(rendererDir, 'index.html');

        if (!fs.existsSync(indexHtmlPath)) {
            throw new Error('out/renderer/index.html missing inside ASAR. Unsupported ZCode version.');
        }

        let htmlCode = fs.readFileSync(indexHtmlPath, 'utf8');

        const payloadPath = path.join(__dirname, 'zcode-payload.js');
        let payloadCode = fs.readFileSync(payloadPath, 'utf8');

        const fontPath = path.join(__dirname, 'Vazirmatn-Variable.woff2');
        let fontBase64 = '';
        if (fs.existsSync(fontPath)) {
            fontBase64 = fs.readFileSync(fontPath).toString('base64');
        }
        payloadCode = payloadCode.replace('__FONT_BASE64__', fontBase64);

        const targetJsPath = path.join(rendererDir, 'zcode-payload.js');
        fs.writeFileSync(targetJsPath, payloadCode);

        const fontDest = path.join(rendererDir, 'Vazirmatn-Variable.woff2');
        if (fs.existsSync(fontPath)) {
            fs.copyFileSync(fontPath, fontDest);
        }

        if (!htmlCode.includes('zcode-payload.js')) {
            if (htmlCode.includes('</body>')) {
                htmlCode = htmlCode.replace('</body>', '  <script src="./zcode-payload.js"></script>\n</body>');
            } else {
                htmlCode = htmlCode.replace('</html>', '  <script src="./zcode-payload.js"></script>\n</html>');
            }
            fs.writeFileSync(indexHtmlPath, htmlCode);
        }
    } catch (e) {
        spinner.fail('Module injection failed.');
        console.error(red(e.message));
        if (fs.existsSync(extractDir)) fs.rmSync(extractDir, { recursive: true, force: true });
        return;
    }

    spinner.text = 'Rebuilding core ASAR package with native module support...';
    try {
        await asar.createPackageWithOptions(extractDir, asarPath, { unpack: '*.{node,dll,exe}' });
        fs.rmSync(extractDir, { recursive: true, force: true });
        spinner.succeed('★ ZCode ecosystem successfully overhauled with Arian Pro RTL UI!');
    } catch (e) {
        spinner.fail('Failed to reconstruct the ZCode ASAR package.');
        console.error(red(e.message));
    }
}

async function main() {
    console.log(green('\n⚡ Initializing ZCode Pro RTL Injector...'));

    if (checkRunningProcesses()) {
        console.log(yellow('\n[!] Notice: ZCode is currently running.'));
        let closeApp = isAutoYes;
        if (!isAutoYes) {
            const response = await prompts({
                type: 'confirm',
                name: 'closeApp',
                message: 'Would you like to close ZCode now to prevent file locks?',
                initial: true
            });
            closeApp = response && response.closeApp;
        }
        if (closeApp) {
            try {
                if (os.platform() === 'win32') {
                    execSync('taskkill /IM ZCode.exe /F', { stdio: 'ignore' });
                } else {
                    execSync('pkill -f -i zcode || true', { stdio: 'ignore' });
                }
                console.log(green('[✓] ZCode processes closed cleanly.\n'));
            } catch (e) {}
        } else {
            console.log(dim('    Proceeding without closing. Remember to restart ZCode afterwards.\n'));
        }
    }

    const detected = getCandidatePaths();

    if (detected.length === 0) {
        console.log(yellow('[?] Automatic scanning failed to locate ZCode on this machine.'));
        const response = await prompts({
            type: 'text',
            name: 'customPath',
            message: `Provide the absolute path to ZCode ('app.asar' file or 'app' resources folder):`
        });

        if (!response.customPath || !fs.existsSync(response.customPath)) {
            console.error(red('\n[!] Invalid trajectory. Process aborted.\n'));
            process.exit(1);
        }

        const isAsar = response.customPath.endsWith('.asar');
        if (isAsar) {
            await patchAsar(response.customPath, isRestore);
        } else {
            await patchUnpackedApp(response.customPath, isRestore);
        }
    } else {
        for (const targetPath of detected) {
            const isAsar = targetPath.endsWith('.asar');
            if (isAsar) {
                await patchAsar(targetPath, isRestore);
            } else {
                await patchUnpackedApp(targetPath, isRestore);
            }
        }
    }

    console.log(green(bold('\n⚡ Master execution completed. Reboot ZCode to initialize the Pro RTL UI.\n')));
}

main().catch(e => {
    console.error(red('\n[!] An unhandled architectural error occurred:'), e.message);
    process.exit(1);
});
