const fs = require('fs');
const path = require("path");
const iconExtractor = require('icon-extractor');
const os = require('os')
const PowerShell = require("powershell");
const { exec } = require('child_process')
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

applist = (callback) => {
    let filterValues = "Select-Object DisplayName,DisplayIcon,UninstallString,DisplayVersion,InstallDate,Publisher,InstallLocation"
    let localMatcine = `Get-ItemProperty HKLM:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\* | ${filterValues}`;
    let currentUser = `Get-ItemProperty HKCU:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\* | ${filterValues}`;
    let Wow6432Node = `Get-ItemProperty HKLM:\\SOFTWARE\\Wow6432Node\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\* | ${filterValues}`;
    if (process.arch == 'x64') {
        var ps = new PowerShell(`chcp 65001;${localMatcine};${currentUser};${Wow6432Node}`);      
    } else {
        var ps = new PowerShell(`chcp 65001;${localMatcine};${currentUser}`);              
    }
    ps.on("output", data => {
        let applist = [];
        let apps = data.trim().replace(/\r\n[ ]{10,}/g,"").split('\r\n\r\n');
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
        applist.shift();
        getico(applist);
        callback(applist);
    });
}

appremove = (command, callback) => {
    command = command.replace(/(^[A-z]:\\[\S ]+\\\S+)($| )/, '"$1"$2')
    exec(command, { encoding : 'buffer' }, (err, stdout, stderr) => {
        if (err) {
            callback(iconv.decode(stderr, 'cp936'));
        }
    })
}

openfolder = (path, callback) => {
    if (path) {
        exec(`explorer.exe ${path}`, { encoding: 'buffer' }, (err, stdout, stderr) => {
            if (err) {
                callback(iconv.decode(stderr, 'cp936'));
            }
        })
    } else {
        callback('注册表中无该软件的安装目录！')
    }
}



applist(apps => {
    for (var app of apps) {
        console.log(app.UninstallString);
    }
})