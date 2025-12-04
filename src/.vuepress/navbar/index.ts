import {navbar} from "vuepress-theme-hope";


export const zhNavbar = navbar([
    "/",
    {
        link: "/posts/",
        text: "文章",
    },
    {
        text: "笔记",
        icon: "page",
        prefix: "/notes/",
        children: [
            {
                text: "网络",
                link: "web-net/"
            }
        ]
    },
    {
        text: "开源项目",
        icon: "ability",
        prefix: "/open_source/",
        children: [
            {
                text: "我的vscode插件",
                link: "vscode-plugin/"
            },
            {
                text: "容器环境配置",
                link: "docker-env/"
            },
            {
                text: "java学习",
                link: "java-learn/"
            },
            {
                text: "python工具",
                link: "python-tools/"
            }
        ]
    },
    {
        text: "分享",
        icon: "share",
        prefix: "/shares/",
        children: [
            {
                text: "工具",
                link: "tools/"
            },
            {
                text: "番剧",
                link: "bangumis/"
            },
        ]
    },
    {
        text: "服务",
        icon: "book",
        children: [
            {
                text: "nps",
                link: "http://nps.nikolazhang.top"
            },
            {
                text: "efak",
                link: "http://efak.nikolazhang.top"
            },
        ]
    },
    {
        text: "网站",
        icon: "network",
        children: [
            {
                text: "nga",
                link: "https://nga.cn/"
            },
            {
                text: "提瓦特大陆",
                link: "https://webstatic.mihoyo.com/ys/app/interactive-map/index.html"
            },
        ]
    }
]);
