(function($){ 
    $(document).ready(function(){
        // 侧栏菜单初始状态设置
        if(theme.minNav != '1')trigger_resizable(true);
        // 主题状态
        if (typeof window.switch_mode === 'function') window.switch_mode();
        // 搜索模块
        intoSearch();
        // 粘性页脚
        stickFooter();
        // 网址块提示 
        if(isPC()){ $('[data-toggle="tooltip"]').tooltip({trigger: 'hover'}); }else{ $('.qr-img[data-toggle="tooltip"]').tooltip({trigger: 'hover'}); }
        // 初始化tab滑块
        intoSlider();
        // 初始化theiaStickySidebar
        $('.sidebar').theiaStickySidebar({
            additionalMarginTop: 90,
            additionalMarginBottom: 20
        });
        // 初始化游客自定义数据
        /*if(theme.isCustomize == '1'){
            intoSites(false);
            intoSites(true);
        }*/
    });
    // Enable/Disable Resizable Event
    var wid = 0;
    $(window).resize(function() {
        clearTimeout(wid);
        wid = setTimeout(go_resize, 200); 
    });
    function go_resize() {
        stickFooter(); 
        //if(theme.minNav != '1'){
            trigger_resizable(false);
        //}
    }
    // count-a数字动画
    $('.count-a').each(function () {
        $(this).prop('Counter', 0).animate({
            Counter: $(this).text()
        }, {
            duration: 1000,
            easing: 'swing',
            step: function (now) {
                $(this).text(Math.ceil(now));
            }
        });
    });
    $(document).on('click', "a[target!='_blank']", function() {
        if( theme.loading=='1' && $(this).attr('href') && $(this).attr('href').indexOf("#") != 0 && $(this).attr('href').indexOf("java") != 0 && !$(this).data('commentid') && !$(this).hasClass('nofx') ){
            var load = $('<div id="load-loading"></div>');
            $("body").prepend(load);
            load.animate({opacity:'1'},200,'swing').delay(2000).hide(300,function(){ load.remove() });
        }
    });
    // 点赞
    $(".btn-like").click(function() {
        var t = $(this);
        if(t.data('action') == "post_like"){
            if (t.hasClass('liked')) {
                showAlert(JSON.parse('{"status":3,"msg":"您已经赞过了!"}'));
            } else {
                var icop = t.children('.flex-column');
                t.addClass('liked'); 
                $.ajax({
                    type : 'POST',
                    url : theme.ajaxurl,  
                    data : {
                        action: t.data('action'),
                        post_id: t.data("id"),
                        ticket: t.data("ticket")
                    },
                    success : function( data ){
                        $am = $('<i class="iconfont icon-heart" style="color: #f12345;transform: scale(1) translateY(0);position: absolute;transition: .6s;opacity: 1;"></i>');
                        icop.prepend($am);
                        showAlert(JSON.parse('{"status":1,"msg":"谢谢点赞!"}'));
                        $('.like-count').html(data);
                        $am.addClass('home-like-hide');
                    },
                    error:function(){ 
                        showAlert(JSON.parse('{"status":4,"msg":"网络错误 --."}'));
                    }
                });
            }
        }else{
            if (t.hasClass('disabled'))
                return false;
            var _delete = 0;
            var id = t.data("id");
            if (t.hasClass('liked')) {
                _delete = 1;
            }
            t.addClass('disabled'); 
            $.ajax({
                type : 'POST',
                url : theme.ajaxurl,  
                data : {
                    action: t.data("action"),
                    post_id: t.data("id"),
                    post_type: t.data("post_type"),
                    delete: _delete,
                    ticket: t.data("ticket")
                },
                success : function( data ){
                    t.removeClass('disabled'); 
                    if(data.status==1){
                        $('.star-count-'+id).html(data.count);
                        if(_delete==1){
                            t.removeClass('liked'); 
                            t.find('.star-ico').removeClass('icon-collection').addClass('icon-collection-line');
                        }
                        else{
                            t.addClass('liked'); 
                            t.find('.star-ico').removeClass('icon-collection-line').addClass('icon-collection');
                        }
                        ioPopupTips(data.status, data.msg);
                        return false;
                    }
                    ioPopupTips(data.status, data.msg);
                },
                error:function(){ 
                    t.removeClass('disabled'); 
                    ioPopupTips(4, "网络错误 --.");
                }
            });
            
        }
        return false;
    });
    // 卡片点赞
    $(document).on('click', '.home-like', function() {
        if ($(this).hasClass('liked')) {
            showAlert(JSON.parse('{"status":3,"msg":"您已经赞过了!"}'));
        } else {
            var icop = $(this);
            var id = $(this).data("id");
            $(this).addClass('liked'); 
            $.ajax({
                type : 'POST',
                url : theme.ajaxurl,  
                data : {
                    action: "post_like",
                    post_id: id
                },
                success : function( data ){
                    $am = $('<i class="iconfont icon-heart" style="color: #f12345;transform: scale(1) translateY(0);position: absolute;transition: .6s;opacity: 1;"></i>');
                    icop.prepend($am);
                    showAlert(JSON.parse('{"status":1,"msg":"谢谢点赞!"}'));
                    $(".home-like-"+id).html(data);
                    $am.addClass('home-like-hide');
                },
                error:function(){ 
                    showAlert(JSON.parse('{"status":4,"msg":"网络错误 --."}'));
                }
            });
        }
        return false;
    });
    //未开启详情页计算访客方法
    $(document).on('click', '.url-card a.is-views[data-id]', function() {
        $.ajax({
            type:"GET",
            url:theme.ajaxurl,
            data:{
                action:'io_postviews',
                postviews_id:$(this).data('id'),
            },
            cache:false,
        });
    });
    //返回顶部
    $(window).scroll(function () {
        if ($(this).scrollTop() >= 50) {
            $('#go-to-up').fadeIn(200);
            $('.big-header-banner').addClass('header-bg');
        } else {
            $('#go-to-up').fadeOut(200);
            $('.big-header-banner').removeClass('header-bg');
        }
    });
    $('.go-up').click(function () {
        $('body,html').animate({
            scrollTop: 0
        }, 500);
    return false;
    }); 

 
    //滑块菜单
    $('.slider_menu').children("ul").children("li").not(".anchor").hover(function() {
        $(this).addClass("hover"),
        //$('li.anchor').css({
        //    transform: "scale(1.05)",
        //}),
        toTarget($(this).parent(),true,true) 
    }, function() {
        //$('li.anchor').css({
        //    transform: "scale(1)",
        //}),
        $(this).removeClass("hover") 
    });
    $('.slider_menu').mouseleave(function(e) {
        var menu = $(this).children("ul");
        window.setTimeout(function() { 
            toTarget(menu,true,true) 
        }, 50)
    }) ;  
    function intoSlider() {
        $(".slider_menu[sliderTab]").each(function() {
            if(!$(this).hasClass('into')){
                var menu = $(this).children("ul");
                menu.prepend('<li class="anchor" style="position:absolute;width:0;height:28px"></li>');
                var target = menu.find('.active').parent();
                if(0 < target.length){
                    menu.children(".anchor").css({
                        left: target.position().left + target.scrollLeft() + "px",
                        width: target.outerWidth() + "px",
                        height: target.height() + "px",
                        opacity: "1"
                    })
                }
                $(this).addClass('into');
            }
        })
    }
    //粘性页脚
    function stickFooter() {
        $('.main-footer').attr('style', '');
        if($('.main-footer').hasClass('text-xs'))
        {
            var win_height                 = jQuery(window).height(),
                footer_height             = $('.main-footer').outerHeight(true),
                main_content_height         = $('.main-footer').position().top + footer_height ;
            if(win_height > main_content_height - parseInt($('.main-footer').css('marginTop'), 10))
            {
                $('.main-footer').css({
                    marginTop: win_height - main_content_height  
                });
            }
        }
    }
 

    $('#sidebar-switch').on('click',function(){
        $('#sidebar').removeClass('mini-sidebar');
	//221024: 调整左导航展开时,点击图标锚定定位失效
        //$('.sidebar-nav .change-href').attr('href','javascript:;');

    }); 
 
    // Trigger Resizable Function
    var isMin = false,
        isMobileMin = false;
    function trigger_resizable( isNoAnim ) {
        if( (theme.minNav == '1' && !isMin && 767.98<$(window).width() )||(!isMin && 767.98<$(window).width() && $(window).width()<1024) ){
            //$('#mini-button').removeAttr('checked');
            $('#mini-button').prop('checked', false);
            trigger_lsm_mini(isNoAnim);
            isMin = true;
            if(isMobileMin){
                $('#sidebar').addClass('mini-sidebar');
                $('.sidebar-nav .change-href').each(function(){$(this).attr('href',$(this).data('change'))});
                isMobileMin = false;
            }
        }
        else if( ( theme.minNav != '1')&&((isMin && $(window).width()>=1024) || ( isMobileMin && !isMin && $(window).width()>=1024 ) ) ){
            $('#mini-button').prop('checked', true);
            trigger_lsm_mini(isNoAnim);
            isMin = false;
            if(isMobileMin){
                isMobileMin = false;
            }
        }
        else if($(window).width() < 767.98 && $('#sidebar').hasClass('mini-sidebar')){
            $('#sidebar').removeClass('mini-sidebar');
            //221024: 调整左导航展开时,点击图标锚定定位失效
            //$('.sidebar-nav .change-href').attr('href','javascript:;');
            isMobileMin = true;
            isMin = false;
        }
    }
    // sidebar-menu-inner收缩展开
    $('.sidebar-menu-inner a').on('click',function(){//.sidebar-menu-inner a //.has-sub a  

        //console.log('--->>>'+$(this).find('span').text());
        if (!$('.sidebar-nav').hasClass('mini-sidebar')) {//菜单栏没有最小化   
            $(this).parent("li").siblings("li.sidebar-item").children('ul').slideUp(200);
            if ($(this).next().css('display') == "none") { //展开
                //展开未展开
                // $('.sidebar-item').children('ul').slideUp(300);
                $(this).next('ul').slideDown(200);
                $(this).parent('li').addClass('sidebar-show').siblings('li').removeClass('sidebar-show');
            }else{ //收缩
                //收缩已展开
                $(this).next('ul').slideUp(200);
                //$('.sidebar-item.sidebar-show').removeClass('sidebar-show');
                $(this).parent('li').removeClass('sidebar-show');
            }
        }
    });
    //菜单栏最小化
    $('#mini-button').on('click',function(){
        trigger_lsm_mini(true);

    });
    function trigger_lsm_mini(isNoAnim){
        if (!$('.header-mini-btn input[type="checkbox"]').prop("checked")) {
            $('.sidebar-nav').removeClass('mini-sidebar');
	    //221024: 调整左导航展开时,点击图标锚定定位失效
            //$('.sidebar-nav .change-href').attr('href','javascript:;');
            $('.sidebar-menu ul ul').css("display", "none");
            if(isNoAnim){
                $('.sidebar-nav').removeClass('animate-nav');
                $('.sidebar-nav').width(170);
            }
            else{
                $('.sidebar-nav').addClass('animate-nav');
                $('.sidebar-nav').stop().animate({width: 170},200);
            }
        }else{
            $('.sidebar-item.sidebar-show').removeClass('sidebar-show');
            $('.sidebar-menu ul').removeAttr('style');
            $('.sidebar-nav').addClass('mini-sidebar');
            $('.sidebar-nav .change-href').each(function(){$(this).attr('href',$(this).data('change'))});
            if(isNoAnim){
                $('.sidebar-nav').removeClass('animate-nav');
                $('.sidebar-nav').width(60);
            }
            else{
                $('.sidebar-nav').addClass('animate-nav');
                $('.sidebar-nav').stop().animate({width: 60},200);
            }
        }
        //$('.sidebar-nav').css("transition","width .3s");
    }
    //显示2级悬浮菜单
    $(document).on('mouseover','.mini-sidebar .sidebar-menu ul:first>li,.mini-sidebar .flex-bottom ul:first>li',function(){
        var offset = 2;
        if($(this).parents('.flex-bottom').length!=0)
            offset = -3;
        $(".sidebar-popup.second").length == 0 && ($("body").append("<div class='second sidebar-popup sidebar-menu-inner text-sm'><div></div></div>"));
        $(".sidebar-popup.second>div").html($(this).html());
        $(".sidebar-popup.second").show();
        var top = $(this).offset().top - $(window).scrollTop() + offset; 
        var d = $(window).height() - $(".sidebar-popup.second>div").height();
        if(d - top <= 0 ){
            top  = d >= 0 ?  d - 8 : 0;
        }
        $(".sidebar-popup.second").stop().animate({"top":top}, 50);
    });
    //隐藏悬浮菜单面板
    $(document).on('mouseleave','.mini-sidebar .sidebar-menu ul:first, .mini-sidebar .slimScrollBar,.second.sidebar-popup',function(){
        $(".sidebar-popup.second").hide();
    });
    //常驻2级悬浮菜单面板
    $(document).on('mouseover','.mini-sidebar .slimScrollBar,.second.sidebar-popup',function(){
        $(".sidebar-popup.second").show();
    });
 
    $(document).on('click', '.ajax-cm-home .ajax-cm', function(event) {
        event.preventDefault();
        var t = $(this); 
        var id = t.data('id');
        var box = $(t.attr('href')).children('.site-list');
        //console.log(box.children('.url-card').length);
        if( box.children('.url-card').length==0 ){ 
            t.addClass('disabled');
            $.ajax({
                url: theme.ajaxurl,
                type: 'POST', 
                dataType: 'html',
                data : {
                    action: t.data('action'),
                    term_id: id,
                },
                cache: true,
            })
            .done(function(response) { 
                if (response.trim()) { 
                    var url = $(response);
                    box.html(url);
                    if(isPC()) url.find('[data-toggle="tooltip"]').tooltip({ trigger: 'hover' });
                } else { 
                }
                t.removeClass('disabled');
            })
            .fail(function() { 
                t.removeClass('disabled');
            }) 
        }
    });

    //首页tab模式请求内容
    $(document).on('click', '.ajax-list a', function(event) {
        event.preventDefault();
        loadAjax( $(this), $(this).parents('.ajax-list') , '.'+$(this).data('target'));
    });

    $(document).on('click', '.ajax-list-home a', function(event) {
        event.preventDefault();
        loadAjax( $(this), $(this).parents('.ajax-list-home'), '.ajax-'+$(this).parents('.ajax-list-home').data('id') );
    });

    function loadAjax(t,parent,body){
        if( !t.hasClass('active') ){ 
            parent.find('a').removeClass('active');
            t.addClass('active');
            if($(body).children(".ajax-loading").length == 0)
                $(body).append('<div class="ajax-loading text-center rounded" style="position:absolute;display:flex;left:0;width:100%;top:-1rem;bottom:.5rem;background:rgba(125,125,125,.5)"><div class="col align-self-center"><i class="iconfont icon-loading icon-spin icon-2x"></i></div></div>');
            $.ajax({
                url: theme.ajaxurl,
                type: 'POST', 
                dataType: 'html',
                data : t.data(),
                cache: true,
            })
            .done(function(response) { 
                if (response.trim()) { 
                    $(body).html('');
                    $(body).append(response); 
                    var url =  $(body).children('#ajax-cat-url').data('url');
                    if(url)
                        t.parents('.d-flex.flex-fill.flex-tab').children('.btn-move.tab-move').show().attr('href', url);
                    else
                        t.parents('.d-flex.flex-fill.flex-tab').children('.btn-move.tab-move').hide();
                    if(isPC()) $('.ajax-url [data-toggle="tooltip"]').tooltip({ trigger: 'hover' });
                } else { 
                    $('.ajax-loading').remove();
                }
            })
            .fail(function() { 
                $('.ajax-loading').remove();
            }) 
        }
    }
    
    // 自定义模块-----------------
    $(".add-link-form").on("submit", function() {
        var siteName = $(".site-add-name").val()
          , siteUrl = $(".site-add-url").val();
          addSiteList({
            id: +new Date,
            name: siteName,
            url: siteUrl
        });
        this.reset();
        this.querySelector("input").focus();
        $(this).find(".btn-close-fm").click();
    });
    var isEdit = false;
    $('.customize-menu .btn-edit').click(function () {
        if(isEdit){
            $('.url-card .remove-site,#add-site').hide();
            $('.url-card .remove-site,.add-custom-site').hide();
            $('.url-card .remove-cm-site').hide();
            $('.customize-sites').removeClass('edit');
            ioSortable();
            $('.customize-menu .btn-edit').html("编辑");
        }else{
            $('.url-card .remove-site,#add-site').show();
            $('.url-card .remove-site,.add-custom-site').show();
            $('.url-card .remove-cm-site').show();
            $('.customize-sites').addClass('edit');
            ioSortable();
            $('.customize-menu .btn-edit').html("确定");
        }
        isEdit = !isEdit;
    }); 
    function addSiteList(site){
        var sites = getItem("myLinks");
        //判断是否重复
        for (var i = 0; i < sites.length; i++) {
            if(sites[i].url==site.url)
            {
                showAlert(JSON.parse('{"status":4,"msg":"该网址已经存在了 --."}'));
                return;
            }
        }
        sites.unshift(site);
        addSite(site,false,false);
        setItem(sites,"myLinks");
    }
    function addSite(site,isLive,isHeader) {
        if(!isLive) $('.customize_nothing').remove();
        else $('.customize_nothing_click').remove(); 
        var url_f,matches = site.url.match(/^(?:https?:\/\/)?((?:[-A-Za-z0-9]+\.)+[A-Za-z]{2,6})/);
        if (!matches || matches.length < 2) url_f=site.url; 
        else {
            url_f=matches[0];
            if(theme.urlformat == '1')
                url_f = matches[1];
        } 
        var newSite = $('<div class="url-card  col-6 '+theme.classColumns+' col-xxl-10a">'+
            '<div class="url-body mini"><a href="'+site.url+'" target="_blank" class="card new-site mb-3 site-'+site.id+'" data-id="'+site.id+'" data-url="'+site.url+'" data-toggle="tooltip" data-placement="bottom" title="'+site.name+'" rel="external nofollow">'+
                '<div class="card-body" style="padding:0.4rem 0.5rem;">'+
                '<div class="url-content d-flex align-items-center">'+
                    '<div class="url-img rounded-circle mr-2 d-flex align-items-center justify-content-center">'+
                        '<img src="' + theme.icourl + url_f + theme.icopng + '">'+
                    '</div>'+
                    '<div class="url-info flex-fill">'+
                        '<div class="text-sm overflowClip_1">'+
                            '<strong>'+site.name+'</strong>'+
                        '</div>'+
                    '</div>'+
                '</div>'+
                '</div>'+
            '</a></div>' +
            '<a href="javascript:;" class="text-center remove-site" data-id="'+site.id+'" style="display: none"><i class="iconfont icon-close-circle"></i></a>'+
        '</div>');
        if(isLive){
            if(isHeader)
                $(".my-click-list").prepend(newSite);
            else
                $(".my-click-list").append(newSite);
            newSite.children('.remove-site').on("click",removeLiveSite);
        } else {
            $("#add-site").before(newSite);
            newSite.children('.remove-site').on("click",removeSite);
        }
        if(isEdit)
            newSite.children('.remove-site').show();
        if(isPC()) $('.new-site[data-toggle="tooltip"]').tooltip({ trigger: 'hover' });
    }
    function getItem(key) {
        var a = window.localStorage.getItem(key);
        return a ? a = JSON.parse(a) : [];
    }
    function setItem(sites,key) {
        window.localStorage.setItem(key, JSON.stringify(sites));
    }
    function intoSites(isLive) {
        var sites = getItem( isLive ? "livelists" : "myLinks" );
        if(sites.length && !isLive && !$("#add-site")[0]){  
            $(".customize_nothing.custom-site").children(".nothing").html('<a href="javascript:;" class="add-new-custom-site" data-action="add_custom_urls" data-term_name="我的导航" data-urls="'+btoa(unescape(encodeURIComponent(JSON.stringify(sites))))+'" >您已登录，检测到您的设备上有数据，点击<strong style="color:#db2323">同步到服务器</strong>。</a>');
            return;
        }
        if (sites.length) {
            for (var i = 0; i < sites.length; i++) {
                addSite(sites[i],isLive,false);
            }
        }
    }
    function removeSite() {
        var id = $(this).data("id"), 
            sites = getItem("myLinks");
        for (var i = 0; i < sites.length; i++){
            if ( parseInt(sites[i].id) === parseInt(id)) {
                sites.splice(i, 1);
                break;
            }
        }
        setItem(sites,"myLinks");
        $(this).parent().remove();
    }
    function removeLiveSite() {
        var id = $(this).data("id"), 
            sites = getItem("livelists");
        for (var i = 0; i < sites.length; i++){
            if ( parseInt(sites[i].id) === parseInt(id)) {
                sites.splice(i, 1);
                break;
            }
        }
        setItem(sites,"livelists");
        $(this).parent().remove();
    }
    $(document).on('click', '.add-new-custom-site', function(event) { 
        var t = $(this);
        $.ajax({
            url: theme.ajaxurl,
            type: 'POST', 
            dataType: 'json',
            data : t.data(),
        })
        .done(function(response) {   
            showAlert(response);
        })
        .fail(function() { 
            showAlert(JSON.parse('{"status":4,"msg":"网络错误 --."}'));
        }) 
    });
    $(".add-custom-site-form").on("submit", function() {
        var t = $(this); 
        var tt = this;
        var url = t.find("input[name=url]").val();
        var name = t.find("input[name=url_name]").val();
        var term_id = t.find('input:radio:checked').val(); 
        var term_name = t.find('input[name=term_name]').val();  
        if(term_name=='' && term_id==undefined){
            showAlert(JSON.parse('{"status":3,"msg":"为什么不选分类"}'));
            return false;
        }
        $.ajax({
            url: theme.ajaxurl,
            type: 'POST', 
            dataType: 'json',
            data : t.serialize()+"&action=add_custom_url",
        })
        .done(function(response) {   
            if(response.status !=1){
                showAlert(response);
                return;
            }
            var url_f,matches = url.match(/^(?:https?:\/\/)?((?:[-A-Za-z0-9]+\.)+[A-Za-z]{2,6})/);
            if (!matches || matches.length < 2) url_f=url; 
            else {
                url_f=matches[0];
                if(theme.urlformat == '1')
                    url_f = matches[1];
            } 
            var id = response.id;
            var newSite = $('<div id="url-'+id+'" class="url-card sortable col-6 '+theme.classColumns+' col-xxl-10a">'+
            '<div class="url-body mini"><a href="'+url+'" target="_blank" class="card new-site mb-3 site-'+id+'" data-id="'+id+'" data-url="'+url+'" data-toggle="tooltip" data-placement="bottom" title="'+name+'" rel="external nofollow">'+
                '<div class="card-body" style="padding:0.4rem 0.5rem;">'+
                '<div class="url-content d-flex align-items-center">'+
                    '<div class="url-img rounded-circle mr-2 d-flex align-items-center justify-content-center">'+
                        '<img src="' + theme.icourl + url_f + theme.icopng + '">'+
                    '</div>'+
                    '<div class="url-info flex-fill">'+
                        '<div class="text-sm overflowClip_1">'+
                            '<strong>'+name+'</strong>'+
                        '</div>'+
                    '</div>'+
                '</div>'+
                '</div>'+
            '</a></div>' +
            '<a href="javascript:;" class="text-center remove-cm-site" data-action="delete_custom_url" data-id="'+id+'"><i class="iconfont icon-close-circle"></i></a>'+
            '</div>');
            $(".add-custom-site[data-term_id="+term_id+"]").before(newSite); 
            tt.reset();
            tt.querySelector("input").focus();
            t.find(".btn-close-fm").click();
            showAlert(JSON.parse('{"status":1,"msg":"添加成功。"}'));
        })
        .fail(function() {  
            showAlert(JSON.parse('{"status":4,"msg":"网络错误 --."}'));
            return;
        })
    });
    $(document).on("click",'.url-card .remove-cm-site', function(event){ 
        var t = $(this); 
        t.addClass('disabled');
        $.ajax({
            url: theme.ajaxurl,
            type: 'POST', 
            dataType: 'json',
            data : t.data(),
        })
        .done(function(response) {   
            if(response.status == 1){
                t.parent().remove();
            }
            t.removeClass('disabled');
            showAlert(response);
        })
        .fail(function() { 
            t.removeClass('disabled');
            showAlert(JSON.parse('{"status":4,"msg":"网络错误 --."}'));
        }) 
    });
    function ioSortable() {
        if($('.customize-sites').hasClass('edit')){
            if(isPC()) $('.customize-sites .new-site[data-toggle="tooltip"]').tooltip('disable');
            //$('.customize-sites').find('a').attr('href','javascript:void(0)');
            $('.customize-sites .site-list').sortable({
                items: '.sortable', 
                containment: ".main-content",
                //'placeholder': "ui-state-highlight",
                update : function(e, ui) {
                    $('.customize-sites .site-list').sortable('disable');
                    var term_id = $(this).data('term_id');
                    var order   = $(this).sortable('serialize');
                    
                    
                    var queryData = { "action": "update_custom_url_order", "term_id" : term_id, "order" : order };
                    $.ajax({
                        url: theme.ajaxurl,
                        type: 'POST',
                        data: queryData,
                        cache: false,
                        dataType: "json",
                        success: function(data){
                            if(data.status != 1){
                                showAlert(data);
                            }
                            $('.customize-sites .site-list').sortable('enable');
                        },
                        error: function(html){
                            $('.customize-sites .site-list').sortable('enable');
                            showAlert(JSON.parse('{"status":4,"msg":"网络错误 --."}'));
                        }
                    });
                
                }
            }); 
        }else{
            if(isPC()) $('.customize-sites .new-site[data-toggle="tooltip"]').tooltip('enable');
            //$('.customize-sites').find('a').attr('href',$(this).data('url'));
            $( ".customize-sites .site-list" ).sortable( "destroy" );
        }

    }

    $("input[name=term_name]").focus(function(){
        var this_input = $("input[name=term_id]"); 
        this_input.prop('checked', false);
    }); 
    $('.form_custom_term_id').on("click", function(event){ 
        $("input[name=term_name]").val("");
    });
    // 搜索模块 -----------------------
    function searchStorageGet(key) {
        try { return window.localStorage.getItem(key); }
        catch (error) { return null; }
    }
    function searchStorageSet(key, value) {
        try { window.localStorage.setItem(key, value); }
        catch (error) {}
    }
    function getSearchTarget($search, preferredTarget) {
        var fallbackTarget = "https://www.baidu.com/s?wd=";
        var $availableTargets = $search.find('.hide-type-list .search-group input:radio');
        var target = preferredTarget || $search.find('.hide-type-list .search-group input:radio:checked').first().val();

        // 只允许页面中预置的搜索地址，避免旧缓存或异常值拼出错误链接。
        return $availableTargets.filter(function () {
            return $(this).val() === target;
        }).length ? target : fallbackTarget;
    }

    function syncSearchForm($search) {
        var $selected = $search.find('.hide-type-list .search-group input:radio:checked').first();
        var target = getSearchTarget($search, $selected.val());
        var placeholder = $selected.data('placeholder') || '输入关键字搜索';

        $search.find('.super-search-fm').attr('action', target).attr('data-search-target', target);
        $search.find('.search-key').attr('placeholder', placeholder);
    }

    function intoSearch() {
        var savedSearch = searchStorageGet("searchlist");
        var savedMenu = searchStorageGet("searchlistmenu");
        var savedInput = savedSearch ? document.getElementById(savedSearch) : null;
        if(savedInput && $(savedInput).closest('.hide-type-list').length){
            $(savedInput).prop('checked', true);
        }
        if(savedMenu){
            $('.s-type-list.big label').removeClass('active');
            $(".s-type-list [data-id]").filter(function () {
                return String($(this).data('id')) === savedMenu;
            }).addClass('active');
        }
        toTarget($(".s-type-list.big"),false,false);
        $('.hide-type-list .s-current').removeClass("s-current");
        $('.hide-type-list input:radio[name="type"]:checked').parents(".search-group").addClass("s-current"); 

        $('.s-search').each(function () {
            syncSearchForm($(this));
        });
        if(savedSearch=='type-zhannei'){
            $(".search-key").attr("zhannei","true"); 
        }
    }
    $(document).on('click', '.s-type-list label', function(event) {
        //event.preventDefault();
        $('.s-type-list.big label').removeClass('active');
        $(this).addClass('active');
        searchStorageSet("searchlistmenu", $(this).data("id"));
        var parent = $(this).parents(".s-search");
        parent.find('.search-group').removeClass("s-current");
        parent.find('#'+$(this).attr("for")).parents(".search-group").addClass("s-current"); 
        toTarget($(this).parents(".s-type-list"),false,false);
    });
    $('.hide-type-list .search-group input').on('click', function() {
        var parent = $(this).parents(".s-search");
        searchStorageSet("searchlist", $(this).attr("id"));
        syncSearchForm(parent);

        if($(this).attr('id')=="type-zhannei")
            parent.find(".search-key").attr("zhannei","true");
        else
            parent.find(".search-key").attr("zhannei","");

        parent.find(".search-key").select();
        parent.find(".search-key").focus();
    });
    $(document).on("submit", ".super-search-fm", function() {
        var $form = $(this);
        var key = encodeURIComponent($form.find(".search-key").val().trim())
        if(key == "")
            return false;
        else{
            var $search = $form.closest('.s-search');
            var target = getSearchTarget($search, $form.attr('data-search-target') || $form.attr('action'));
            window.open(target + key, '_blank', 'noopener,noreferrer');
            return false;
        }
    });
    $('.nav-login-user.dropdown').hover(function(){
        if(!$(this).hasClass('show'))
            $(this).children('a').click();
    },function(){
        //$(this).removeClass('show');
        //$(this).children('a').attr('aria-expanded',false);
        //$(this).children('.dropdown-menu').removeClass('show');
    });
    $('#add-new-sites-modal').on('show.bs.modal', function (event) {
        var button = $(event.relatedTarget); 
        var modal = $(this);
        modal.find('[name="term_id"]').val(  button.data('terms_id') );
        modal.find('[name="url"]').val(  button.data('new_url') );
        modal.find('[name="url_name"]').val('');
        modal.find('[name="url_summary"]').removeClass('is-invalid').val('');
        button.data('new_url','');
        var _url = modal.find('[name="url"]').val();
        if(_url!=''){
            getUrlInfo(_url,modal);
            urlStartValue = _url;
        }
    });
    var urlStartValue = '';
    $('#modal-new-url').on('blur',function(){
        var t = $(this);
        if(t.val()!=''){
            if(isURL(t.val())){
                if(urlStartValue!=t.val()){
                    urlStartValue = t.val();
                    getUrlInfo(t.val(),$('.add_new_sites_modal'));
                }
            }else{
                showAlert(JSON.parse('{"status":4,"msg":"URL 无效！"}'));
            }
        }
    });
    $('#modal-new-url-summary').on('blur',function(){
        var t = $(this);
        if(t.val()!=''){
            t.removeClass('is-invalid');
        }
    });
    function getUrlInfo(_url,modal){
        $('#modal-new-url-ico').show();
		$.post("//apiv2.iotheme.cn/webinfo/get.php", { url: _url ,key: theme.apikey },function(data,status){ 
			if(data.code==0){
                $('#modal-new-url-ico').hide();
				$("#modal-new-url-summary").addClass('is-invalid');
			}
			else{
                $('#modal-new-url-ico').hide();
                if(data.site_title=="" && data.site_description==""){
                    $("#modal-new-url-summary").addClass('is-invalid');
                }else{
                    modal.find('[name="url_name"]').val(data.site_title);   
                    modal.find('[name="url_summary"]').val(data.site_description);
                }
			}
		}).fail(function () {
            $('#modal-new-url-ico').hide();
			$(".refre_msg").html('访问超时，请再试试，或者手动填写').show(200).delay(4000).hide(200);
		});
    }
})(jQuery);
function isURL(URL){
    var str=URL;
    var Expression=/http(s)?:\/\/([\w-]+\.)+[\w-]+(\/[\w- .\/?%&=]*)?/;
    var objExp=new RegExp(Expression);
    if(objExp.test(str)==true){
        return true;
    }else{
        return false;
    }
}
function isPC() {
    let u = navigator.userAgent;
    let Agents = ["Android", "iPhone", "webOS", "BlackBerry", "SymbianOS", "Windows Phone", "iPad", "iPod"];
    let flag = true;
    for (let i = 0; i < Agents.length; i++) {
        if (u.indexOf(Agents[i]) > 0) {
            flag = false;
            break;
        }
    }
    return flag;
}
function chack_name(str){
    //var pattern = RegExp(/[( )(\ )(\~)(\!)(\@)(\#)(\$)(\%)(\^)(\&)(\*)(\()(\))(\-)(\_)(\+)(\=)(\[)(\])(\{)(\})(\|)(\\)(\;)(\:)(\')(\")(\,)(\.)(\/)(\<)(\>)(\»)(\«)(\“)(\”)(\?)(\)]+/);
    var pattern = RegExp(/[( )(\ )(\~)(\!)(\@)(\#)(\$)(\%)(\^)(\*)(\()(\))(\+)(\=)(\[)(\])(\{)(\})(\\)(\;)(\:)(\')(\")(\,)(\.)(\/)(\<)(\>)(\»)(\«)(\“)(\”)(\?)(\)]+/);
    if (pattern.test(str)){
        return true;
    }
    return false;
}
function showAlert(data) {
    var title,alert,ico;
    switch(data.status) {
        case 1: 
            title = '成功';
            alert='success';
            ico='icon-adopt';
            break;
        case 2: 
            title = '信息';
            alert='info';
            ico='icon-tishi';
            break;
        case 3: 
            title = '警告';
            alert='warning';
            ico='icon-warning';
            break;
        case 4: 
            title = '错误';
            alert='danger';
            ico='icon-close-circle';
            break;
        default: 
    } 
    var msg = data.msg;
    if(!$('#alert_placeholder').hasClass('text-sm')){
        $('body').append('<div id="alert_placeholder" class="text-sm" style="position: fixed;bottom: 10px;right: 10px;z-index: 2000;text-align: right;text-align: -webkit-right"></div>')
    }
    $html = $('<div class="alert-body" style="display:none;"><div class="alert alert-'+alert+' text-lg pr-4 pr-md-5" style="text-align:initial"><i class="iconfont '+ico+' icon-lg" style="vertical-align: middle;margin-right: 10px"></i><span style="vertical-align:middle">'+title+'</span><br><span class="text-md" style="margin-left:30px;vertical-align:middle">'+msg+'</span></div></div>');
    $('#alert_placeholder').append( $html );//prepend
    $html.show(200).delay(3500).hide(300, function(){ $(this).remove() }); 
} 
function toTarget(menu, padding, isMult) {
    var slider =  menu.children(".anchor");
    var target = menu.children(".hover").first() ;
    if (target && 0 < target.length){
    }
    else{
        if(isMult)
            target = menu.find('.active').parent();
        else
            target = menu.find('.active');
    }
    if(0 < target.length){
        if(padding)
        slider.css({
            left: target.position().left + target.scrollLeft() + "px",
            width: target.outerWidth() + "px",
            opacity: "1"
        });
        else
        slider.css({
            left: target.position().left + target.scrollLeft() + (target.outerWidth()/4) + "px",
            width: target.outerWidth()/2 + "px",
            opacity: "1"
        });
    }
    else{
        slider.css({
            opacity: "0"
        })
    }
}
var ioadindex = 0;
function loadingShow(parent = "body"){
    if($('.load-loading')[0]){
        ioadindex ++;
        return $('.load-loading');
    }
    var load = $('<div class="load-loading" style="display:none"><div class="bg"></div><div class="rounded-lg bg-light" style="z-index:1"><div class="spinner-border m-4" role="status"><span class="sr-only">Loading...</span></div></div></div>');
    $(parent).prepend(load);
    load.fadeIn(200);
    return load;
}
function loadingHid(load){
    if(ioadindex>0)
        ioadindex--;
    else{
        ioadindex = 0;
        load.fadeOut(300,function(){ load.remove() });
    }
}
function ioPopupTips(type, msg, callBack) {
	var ico = '';
    switch(type) {
        case 1: 
            ico='icon-adopt';
            break;
        case 2: 
            ico='icon-tishi';
            break;
        case 3: 
            ico='icon-warning';
            break;
        case 4: 
            ico='icon-close-circle';
            break;
        default: 
    } 
	var c = type==1 ? 'tips-success' : 'tips-error';
	var html = '<section class="io-bomb '+c+' io-bomb-sm io-bomb-open">'+
					'<div class="io-bomb-overlay"></div>'+
                    '<div class="io-bomb-body text-center">'+
                        '<div class="io-bomb-content bg-white px-5"><i class="iconfont '+ico+' icon-8x"></i>'+
                            '<p class="text-md mt-3">'+msg+'</p>'+
                        '</div>'+
                    '</div>'+
                '</section>';
    var tips = $(html);
	$('body').addClass('modal-open').append(tips);
	setTimeout(function(){
        $('body').removeClass('modal-open');
        if ($.isFunction(callBack)) callBack(true); 
		tips.removeClass('io-bomb-open').addClass('io-bomb-close');
		setTimeout(function(){
			tips.removeClass('io-bomb-close');
			setTimeout(function(){
				tips.remove();
			}, 200);
		},400);
	},2000);
}
function ioPopup(type, html, maskStyle, btnCallBack) {
	var maskStyle = maskStyle ? 'style="' + maskStyle + '"' : '';
	var size = '';
	if( type == 'big' ){
		size = 'io-bomb-lg';
	}else if( type == 'no-padding' ){
		size = 'io-bomb-nopd';
	}else if( type == 'cover' ){
		size = 'io-bomb-cover io-bomb-nopd';
	}else if( type == 'full' ){
		size = 'io-bomb-xl';
	}else if( type == 'small' ){
		size = 'io-bomb-sm';
	}else if( type == 'confirm' ){
		size = 'io-bomb-md';
	}
	var template = '\
	<div class="io-bomb ' + size + ' io-bomb-open">\
		<div class="io-bomb-overlay" ' + maskStyle + '></div>\
		<div class="io-bomb-body text-center">\
			<div class="io-bomb-content bg-white">\
				'+html+'\
			</div>\
			<div class="btn-close-bomb mt-2">\
                <i class="iconfont icon-close-circle"></i>\
            </div>\
		</div>\
	</div>\
	';
	var popup = $(template);
	$('body').addClass('modal-open').append(popup);
	var close = function(){
        $('body').removeClass('modal-open');
		$(popup).removeClass('io-bomb-open').addClass('io-bomb-close');
		setTimeout(function(){
			$(popup).removeClass('io-bomb-close');
			setTimeout(function(){
				popup.remove();
			}, 200);
		},600);
	}
	$(popup).on('click touchstart', '.btn-close-bomb i, .io-bomb-overlay', function(event) {
		event.preventDefault();
        if ($.isFunction(btnCallBack)) btnCallBack(true); 
		close();
	}); 
	return popup;
} 
function ioConfirm(message, btnCallBack) {
	var template = '\
	<div class="io-bomb io-bomb-confirm io-bomb-open">\
		<div class="io-bomb-overlay"></div>\
		<div class="io-bomb-body">\
			<div class="io-bomb-content bg-white">\
				'+message+'\
                <div class="text-center mt-3">\
                    <button class="btn btn-danger mx-2" onclick="_onclick(true);">确定</button>\
                    <button class="btn btn-light mx-2" onclick="_onclick(false);">取消</button>\
                </div>\
			</div>\
		</div>\
	</div>\
	';
	var popup = $(template);
	$('body').addClass('modal-open').append(popup);
    _onclick = function (r) { 
        close();
        if ($.isFunction(btnCallBack)) btnCallBack(r); 
    };
	var close = function(){
        $('body').removeClass('modal-open');
		$(popup).removeClass('io-bomb-open').addClass('io-bomb-close');
		setTimeout(function(){
			$(popup).removeClass('io-bomb-close');
			setTimeout(function(){
				popup.remove();
			}, 200);
		},600);
	}
	return popup;
}
