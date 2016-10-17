/**
 * Created by yelingfeng on 2016/10/14.
 * 宁夏新导航菜单
 * $ : jquery
 * _ : lodash
 */

(function($,_){

    var submenuClass = '.m2-submenu',
        submenuOpenClass = 'm2-submenu-open',
        submenuClosedClass = 'm2-submenu-closed',
        tmpl = `<div id="menu-container">
                      <div class="menu-icon">
                         <div class="menu-home"></div>
                         <div class="menu-fast"></div>
                      </div>
                         <div class="menu-box">
                            <div class="top_fx"></div>
                            <div class="bom_fx"></div>
                        </div>
                        <div class="menu-fast-box">
                            
                        </div>
                     </div>
                </div>`,
        mapping = {
            'hlwllgl': 8,
            'ymaqjc' : 5,
            'wzaqjc' : 6,
            'ddos': 7,
            'ycsjwjfx' : 2,
            'zhcx':3,
            'sjdc':9,
            'zsk':1,
            'xtgl' :4
        };


    var NXMenu = function(config){
        this.config = $.extend({}, config);
        if(this.config.data == undefined){
            throw new Error("初始化数据data不存在,请构建时给定数据 new NXMenu({data:[...]})");
        }
        this._init();
    }

    NXMenu.prototype = {
        _init:function(){
            this.$el = $(tmpl);
            this.iconDom = $(".menu-icon",this.$el);
            this.homeBtn = $(".menu-home" , this.$el);
            this.fastBtn = $(".menu-fast",this.$el);
            this.menuBox = $(".menu-box",this.$el);
            this.fastMenuBox = $(".menu-fast-box",this.$el);

            this.menuItem = $(".menu-item",this.menuBox);
            this.submenu = $(submenuClass);
            this.$el.appendTo("body")
            this.create();
            this.bind();
        },

        opend:function(){
            this.iconDom.addClass("ready");
        },
        closed:function(){
            this.iconDom.removeClass("ready");
        },

        /**
         * 映射一下数据库中已有的icon地址 转换成菜单识别的icon类型
         *
         * 如果不存在映射集合里 返回x {x:一个默认图标序号}
         * @param iconUrl
         * @returns {*|string}
         */
        mappingDatabaseIcon:function(iconUrl){
            var key = iconUrl != null && iconUrl.split('\.')[0];
            return mapping[key] || "x";
        },


        /**
         * 创建二级菜单
         * @param subMenu 二级菜单data
         * @private
         */
        _createSubMenu(subMenu){
            var str = _.chain(subMenu).map(function(sub){
                var threeMenu = sub.sonmenu || [];
                var hasThree = threeMenu.length ;
                var subItemClass= hasThree ? "m2-submenu "+submenuClosedClass :"m2-link";
                var str =`<li class="${subItemClass}" data-id="${sub.id}"><a href="javascript:;" data-href="${sub.url}">${sub.name}</a>`;
                if(hasThree){
                    // 三级菜单
                    var threeMenu = _.chain(threeMenu).map(function(tm){
                        return  `<li class="m2-link" rel="sub" data-id="${tm.id}"><a href="javascript:;" data-href="${tm.url}">${tm.name}</a></li>`
                    }).join('').value();
                    var treeStr = `<ul>${threeMenu}</ul>`;
                    str += treeStr ;
                }
                str +='</li>';
                return str;
            }).join('').value();
            return str;
        },


        create:function(){
            var me = this;
            var dataChain = _.chain(this.config.data);
            // 遍历一级菜单
            var itemList = dataChain.map(function(it){
                var iconkey = me.mappingDatabaseIcon(it.icon);
                var subMenu = it.sonmenu;
                var astr = '<a class="menu-a" href="javascript:;"><i class="bg'+iconkey+'"></i><span>'+it.name+'</span></a>';
                var $li  = $('<li class="menu-item" data-id="'+it.id+'">'+astr+'</li>');
                // 二级菜单
                if(subMenu.length){
                    var sd = me._createSubMenu(subMenu);
                    var $sub = $(`<div class="menu-content"><nav class="m2">${astr}<ul>${sd}</ul></nav></div>`);
                   $li.append($sub)
                }
                return $li[0].outerHTML ;

            }).join('').value();

            var menu = $("<ul class='m1'></ul>");
            menu.append(itemList).appendTo(this.menuBox);


            this.createFastMenu();
        },

        // 创建当前快捷菜单
        createFastMenu:function(){

            var curMenu = this.config.curMenu;
            var id = curMenu.id;

            var $sub = $("<div class='fast-header'><span>"+curMenu.name+"</span></div>").append('<div class="top_fx"></div><div class="bom_fx"></div>');
            this.fastMenuBox.append($sub)
            if(id!=null){
                // 得到二级数据
                var subData =  _.chain(this.config.data).find(function(it){
                     return it.id == id;
                }).value();
                var subMenu = subData.sonmenu;
                if(subMenu!=null && subMenu.length){
                    var strMenuDOM = this._createSubMenu(subMenu);
                    this.fastMenuBox.append("<nav class='fast-nav'><ul>"+strMenuDOM+"</ul></nav>");
                }

            }

        },


        bind:function(){
            var me = this;
            this.homeBtn.on('mouseenter',function(){
                if(!me.menuBox.hasClass("open")){
                    me.menuBox.addClass('open');

                    me.fastMenuBox.removeClass('open');
                }
            })

            this.fastBtn.on('mouseenter',function(){
                if(!me.fastMenuBox.hasClass("open")){
                    me.fastMenuBox.addClass('open');

                    me.menuBox.removeClass('open');
                }
            })



            this.bindMenu();
            this.bindSubMenu();
            this.bindDocument();
            this.bindUrlAction();
        },
        bindUrlAction:function () {
            var me  = this;
            this.menuBox.delegate("a[data-href]",'click',function(e){
                var href = $(this).attr("data-href");
                if(href == "null" || href == "" )return;
                $.isFunction(me.config.clickFn) && me.config.clickFn(href);
                e.stopPropagation()
            })

            this.fastMenuBox.delegate("a[data-href]",'click',function(e){
                var href = $(this).attr("data-href");
                if(href == "null" || href == "" )return;
                $.isFunction(me.config.clickFn) && me.config.clickFn(href);
                e.stopPropagation()
            })


        },

        // 绑定一级菜单
        bindMenu:function(){
            this.menuBox.delegate(".menu-item",'mouseenter',function(e){
                var $m2 = $(this).find(".m2");
                if($m2.length){
                    $m2.addClass("top")
                    $(this).children(".menu-a").css("opacity","0")
                    $(this).find(".menu-content").show();
                }
            });
            this.menuBox.delegate(".menu-item",'mouseleave',function(e){
                var $m2 = $(this).find(".m2");
                if($m2.length){
                    $m2.removeClass("top")
                    $(this).children(".menu-a").css("opacity","1")
                    $(this).find(".menu-content").hide();
                }
            });
            this.menuBox.on("mouseleave",function(){
                $(this).removeClass("open")
            })

            this.fastMenuBox.on("mouseleave",function(){
               $(this).removeClass("open")
            })
        },

        // document绑定 撤销一些操作
        bindDocument:function(){
            var me = this;
            $(document).on('click',function(){
                // var m2 = me.menuBox.find(".m2");
                // if(m2 && m2.hasClass("top")){
                //     m2.removeClass("top")
                //     // $(".menu-a").css("opacity","1")
                //     // $(".menu-content").hide();
                // }
                // me.menuBox.removeClass('open');
            })
        },

        // 二级菜单绑定
        bindSubMenu:function(){
            $(submenuClass).addClass(submenuClosedClass);
            $(submenuClass).on('click', function(e){
                var selected = $(this);
                if( selected.hasClass(submenuClosedClass) ) {
                    $(submenuClass).addClass(submenuClosedClass).removeClass(submenuOpenClass);
                    selected.removeClass(submenuClosedClass).addClass(submenuOpenClass);
                }else{
                    selected.addClass(submenuClosedClass).removeClass(submenuOpenClass);
                }
            });
        }

    }

    window.NXMenu = NXMenu;

})(jQuery,_)