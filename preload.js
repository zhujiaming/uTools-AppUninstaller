const fs = require('fs');
const path = require("path");
const iconExtractor = require('icon-extractor');
const os = require('os')
const child = require('child_process')
const iconv = require('iconv-lite')

getico = apps =>{
    iconExtractor.emitter.on('icon', function (data) {
        let icondir = path.join(os.tmpdir(), 'ProcessIcon')
        fs.exists(icondir, exists => {
            if (!exists) { fs.mkdirSync(icondir) }
            let iconpath = path.join(icondir, `${data.Context}.png`)
            fs.exists(iconpath, exists => {
                if (!exists) {
                    fs.writeFile(iconpath, data.Base64ImageData, "base64", err => {
                        if (err) { console.log(err); }
                    })
                }
            })
        })
    });

    for (var app of apps) {
        if (app.DisplayIcon != undefined) {
            app.DisplayIcon = app.DisplayIcon.split(',')[0];
        }
        iconExtractor.getIcon(app.LegalName, app.DisplayIcon);
    }
}

powershell = (cmd, callback) => {
    const ps = child.spawn('powershell', ['-NoProfile', '-Command', cmd], { encoding: 'buffer' })
    let chunks = [];
    let err_chunks = [];
    ps.stdout.on('data', chunk => {
        chunks.push(iconv.decode(chunk, 'cp936'))
    })
    ps.stderr.on('data', err_chunk => {
        err_chunks.push(iconv.decode(err_chunk, 'cp936'))
    })
    ps.on('close', code => {
        let stdout = chunks.join("");
        let stderr = err_chunks.join("");
        callback(stdout, stderr)
    })
}

applist = (callback) => {
    let filterValues = "Select-Object DisplayName,DisplayIcon,UninstallString,DisplayVersion,InstallDate,Publisher,InstallLocation"
    let localMatcine = `Get-ItemProperty HKLM:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\* | ${filterValues}`;
    let currentUser = `Get-ItemProperty HKCU:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\* | ${filterValues}`;
    let Wow6432Node = `Get-ItemProperty HKLM:\\SOFTWARE\\Wow6432Node\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\* | ${filterValues}`;
    let x64 = process.arch == 'x64' ? `;${Wow6432Node}` : '';
    powershell(`${localMatcine};${currentUser}${x64}`, (stdout, stderr) => {
        let applist = [];
        let apps = stdout.trim().replace(/\r\n[ ]{10,}/g,"").split('\r\n\r\n');
        for (var app of apps) {
            dict = {}
            let lines = app.split('\r\n')
            for (var line of lines) {
                if (line) {
                    let key = line.split(/\s+:\s*/)[0];
                    let value = line.split(/\s+:\s*/)[1];
                    dict[key] = value;
                }
            }
            if (dict.DisplayName) {
                dict.LegalName = dict.DisplayName.replace(/[\\\/\:\*\?\"\<\>\|]/g, "");
                var icon = path.join(os.tmpdir(), 'ProcessIcon', `${encodeURIComponent(dict.LegalName)}.png`);
                dict.Icon = icon
                applist.push(dict);
            }
        }
        getico(applist);
        callback(applist);
    });
}

appremove = (command, callback) => {
    command = command.replace(/(^[A-z]:\\[\S ]+\\\S+)($| )/, '"$1"$2')
    child.exec(command, { encoding : 'buffer' }, (err, stdout, stderr) => {
        if (err) {
            callback(iconv.decode(stderr, 'cp936'));
        }
    })
}

openfolder = (path, callback) => {
    if (path) {
        child.exec(`explorer.exe ${path}`, { encoding: 'buffer' }, (err, stdout, stderr) => {
            if (err) {
                callback(iconv.decode(stderr, 'cp936'));
            }
        })
    } else {
        callback('注册表中无该软件的安装目录！')
    }
}