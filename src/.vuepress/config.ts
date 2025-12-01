import theme from "./theme.js";
import {defineUserConfig} from "vuepress";


export default defineUserConfig({
    base: "/",
    theme,
    head: [
      ["link", { href: "https://fontsapi.zeoseven.com/442/main/result.css", rel: "stylesheet" }], // Maple Mono NF CN
      ["link", { href: "https://fontsapi.zeoseven.com/88/main/result.css", rel: "stylesheet" }], // MaokenZhuyuanTi
    ],
    shouldPrefetch: false,
    plugins: [
      
    ],
});
