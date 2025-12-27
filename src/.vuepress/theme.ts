import {hopeTheme} from "vuepress-theme-hope";
import {zhNavbar} from "./navbar";
import {zhSidebar} from "./sidebar";

export default hopeTheme({
    hostname: "https://blog.nikolazh.eu.org",
    author: {
        name: "DewyYr、",
        url: "https://blog.nikolazh.eu.org",
    },
    logo: "/head.svg",
    repo: "https://github.com/NikolaZhang/dew-blog",
    docsDir: "docs",
    pageInfo: ["Date", "Tag", "ReadingTime"],
    blog: {
        name: "DewyYr、",
        avatar: "/head.svg",
        description: "全人类的幻想乡",
        timeline: "朝花夕拾",
        articlePerPage: 20,
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
        icon: {
            // 关键词: "iconify", "fontawesome", "fontawesome-with-brands"
            assets: "fontawesome",
        },
        docsearch: {
            appId: 'LPNQHO03XM',
            apiKey: '69aec575fa0d1e47d7b3b5a07ba2517b',
            indexName: 'blog_nikolazh_eu_org_lpnqho03xm_articles',
            searchParameters: {
                facetFilters: ["*"],
            },
        },
        // search: true,
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
        sitemap: true,
    },
});
