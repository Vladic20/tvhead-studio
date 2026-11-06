import { Config } from "@remotion/cli/config";
Config.setBrowserExecutable("C:/Program Files/Google/Chrome/Application/chrome.exe");
Config.setChromeMode("headless-shell");
Config.setChromiumOpenGlRenderer("angle"); // WebGL (shaders, three.js) in headless render
