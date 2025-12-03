import {hopeTheme} from "vuepress-theme-hope";
import {zhNavbar} from "./navbar";
import {zhSidebar} from "./sidebar";

export default hopeTheme({
    hostname: "https://nikolazhang.github.io",
    author: {
        name: "我小叮当、",
        url: "https://nikolazhang.github.io",
    },
    logo: "/head.svg",
    repo: "https://github.com/NikolaZhang/nikolazhang.github.io",
    docsDir: "docs",
    pageInfo: ["Date", "Tag", "ReadingTime"],
    blog: {
        name: "我小叮当、",
        avatar: "/head.svg",
        description: "全人类的幻想乡",
        timeline: "朝花夕拾",
        articlePerPage: 10,
        articleInfo: ["Date", "Tag", "ReadingTime"],
        intro: "/",
        medias: {
            Email: "mailto:nikolazhang@163.com",
            Gitee: "https://gitee.com/NikolaZhang",
            GitHub: "https://github.com/NikolaZhang",
            QQ: "http://wpa.qq.com/msgrd?v=3&uin=2869581218&site=qq&menu=yes",
            Wechat: "/wechat.jpg",
        },
    },
    // navbar
    navbar: zhNavbar,
    // sidebar
    sidebar: zhSidebar,
    sidebarSorter: ["readme", "filename"],
    footer: "nikola | 鲁ICP备20000559号-1",
    displayFooter: true,
    // page meta
    metaLocales: {
        editLink: "在 GitHub 上编辑此页",
    },
    encrypt: {
        config: {
            "/demo/encrypt.html": ["nikola"],
            "/zh/demo/encrypt.html": ["nikola"],
        },
    },
    markdown: {
        linkify: true,
        figure: true,
        imgLazyload: true,
        chartjs: true,
        echarts: true,
        flowchart: true,
        markmap: true,
        mermaid: true,
        plantuml: true,
    },
    plugins: {
        blog: {
            excerpt: false
        },
        docsearch: {
            appId: 'DT4A7MCZUJ',
            apiKey: '76028292f26cbfa2c3f547d465359542',
            indexName: ''
        },
        // If you don't need comment feature, you can remove following option
        // The following config is for demo ONLY, if you need comment feature, please generate and use your own config, see comment plugin documentation for details.
        // To avoid disturbing the theme developer and consuming his resources, please DO NOT use the following config directly in your production environment!!!!!
        comment: {
            provider: "Waline",
            serverURL: "https://vercel-blog-comment.nikolazh.eu.org/",
            meta: ['nick', 'mail', 'link'],
            requiredMeta: ['nick'],
            reaction: true,
            emoji: [
                '//unpkg.com/@waline/emojis@1.1.0/qq',
                '//unpkg.com/@waline/emojis@1.1.0/tieba',
            ],
        },
    },
});
