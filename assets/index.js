uninstall = (command) => {
    window.appremove(command, err => {
        if (err) {
            $("#infopannel").css({ "background": "#EF5350" });
            $("#infopannel").html(err).fadeIn(300).delay(3000).fadeOut(300);
        } else {
            $("[command='" + command + "']").fadeOut(300).remove()
            let appnum = $(".appinfo").length
            utools.setExpendHeight(appnum > 10 ? 500 : 50 * appnum);
            window.applist((app) => {
                window.apps = app
            });
        }
    });
}

open = (path) => {
    window.openfolder(path, err => {
        if (err) {
            $("#infopannel").css({ "background": "#EF5350" });
            $("#infopannel").html(err).fadeIn(300).delay(3000).fadeOut(300);
        }
    })
}

show = (apps, text) => {
    var appinfo = '';
    for (var t of apps) {
        if (t.UninstallString && t.DisplayName.toUpperCase().search(text.toUpperCase()) != -1) {
            appinfo += "<div class='appinfo' command='" + t.UninstallString + "' location='" + t.InstallLocation + "'>";
            appinfo += '<img src="file:///' + t.Icon + '">';
            appinfo += '<div class="date">' + t.InstallDate.replace(/(\d{4})(\d{2})(\d{2})/,'$1年$2月$3日') + '</div>';
            appinfo += '<div class="description">' + t.DisplayName + '</div>';
            appinfo += '<div class="version">版本号: ' + t.DisplayVersion + '&nbsp;&nbsp;&nbsp;发布者: '+ t.Publisher + '</div></div>';
            }
        }
    $("#applist").html(appinfo);
    $(".appinfo:first").addClass('select');
    let appnum = $(".appinfo").length
    utools.setExpendHeight(appnum > 10 ? 500 : 50 * appnum);
}

utools.onPluginEnter(({ code, type, payload }) => {
    utools.setExpendHeight(0);
    window.applist((app) => {
        window.apps = app;
        show(window.apps, '');
        utools.setSubInput(({ text }) => {
                show(window.apps, text)
            }, '输入程序名，回车卸载，或点击卸载');
        });
});
    
$("#applist").on('mousedown', '.appinfo', function (e) {
    if (1 == e.which) {
        uninstall($(this).attr('command'));
    } else if (3 == e.which) {
        open($(this).attr('location'))
    }
});
 
$("#applist").on('mouseover', '.appinfo', function () {
    $(".select").removeClass('select');
    $(this).addClass('select')
});

$(document).keydown(e => {
    switch (e.keyCode) {
        case 13:
            if (event.shiftKey) {
                open($(".select").attr('location'));
            } else {
                uninstall($(".select").attr('command'));
            }
            break;
        case 38:
            let pre = $(".select").prev();
            if(pre.length != 0){
                event.preventDefault();
                if(pre.offset().top < $(window).scrollTop()){
                    $("html").animate({ scrollTop: "-=50" }, 0);
                }
                pre.addClass("select");
                $(".select:last").removeClass("select");
            }else{
                $(".select").animate({"opacity":"0.3"}).delay(500).animate({"opacity":"1"})
            }
            break;   
        case 40:
            let next = $(".select").next();
            if(next.length !=0){
                event.preventDefault();
                if(next.offset().top >= $(window).scrollTop() + 500){
                    $("html").animate({ scrollTop: "+=50" }, 0);
                }
                next.addClass("select");
                $(".select:first").removeClass("select");
            }else{
                $(".select").animate({"opacity":"0.3"}).delay(500).animate({"opacity":"1"})
            }
            break;
    }
});
